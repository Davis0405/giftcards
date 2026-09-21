from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from django.utils.crypto import constant_time_compare
from django.core.mail import EmailMessage
from django.conf import settings
from decimal import Decimal
import os
import time as pytime

from core.models import GiftCard, Transaccion, CierreDiario
from core.services import procesar_consumo
from core.utils import render_to_pdf
from core.views import EmailThread
from .serializers import CobroPOSSerializer, RecargaPOSSerializer

class ConsultarTarjetaPOSView(APIView):
    """
    Consulta el estado y saldo de una tarjeta para la Terminal POS.
    GET /api/pos/tarjeta/<uuid:uuid>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        tarjeta = get_object_or_404(GiftCard, id=uuid)
        
        # Validar vigencia
        vencida = False
        if tarjeta.fecha_vencimiento and tarjeta.fecha_vencimiento < timezone.now().date():
            vencida = True

        cliente_nombre = "Anónimo"
        if tarjeta.dueno:
            cliente_nombre = tarjeta.dueno.get_full_name() or tarjeta.dueno.username
        elif tarjeta.email_cliente:
            cliente_nombre = tarjeta.email_cliente

        return Response({
            "id": str(tarjeta.id),
            "saldo": str(tarjeta.saldo),
            "activa": tarjeta.activa,
            "vencida": vencida,
            "fecha_vencimiento": tarjeta.fecha_vencimiento,
            "cliente": cliente_nombre,
            "operable": tarjeta.activa and not vencida
        })

class CobrarPOSView(APIView):
    """
    Procesa un cobro desde la terminal POS con verificación de PIN.
    POST /api/pos/cobrar/
    Body: { "uuid": "...", "monto": 50.00, "pin": "1234" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CobroPOSSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        tarjeta = get_object_or_404(GiftCard, id=data['uuid'])

        # 1. Validaciones de estado
        if not tarjeta.activa:
            return Response({"error": "Esta tarjeta se encuentra bloqueada."}, status=status.HTTP_400_BAD_REQUEST)

        if tarjeta.fecha_vencimiento and tarjeta.fecha_vencimiento < timezone.now().date():
            return Response({"error": "Esta tarjeta ha vencido."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validación de PIN constante para prevenir timing attacks
        if not constant_time_compare(data['pin'], tarjeta.pin):
            pytime.sleep(1) # Delay anti-brute force
            return Response({"error": "PIN incorrecto."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Procesar consumo atómico con bloqueo de fila
        try:
            nuevo_saldo = procesar_consumo(
                uuid_tarjeta=tarjeta.id,
                monto=data['monto'],
                usuario_operador=request.user
            )
            return Response({
                "mensaje": f"Cobro de Q{data['monto']} procesado exitosamente.",
                "nuevo_saldo": str(nuevo_saldo),
                "monto_cobrado": str(data['monto']),
                "tarjeta_id": str(tarjeta.id)
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RecargarPOSView(APIView):
    """
    Procesa una recarga de saldo desde la terminal POS.
    POST /api/pos/recargar/
    Body: { "uuid": "...", "monto": 100.00 }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RecargaPOSSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        tarjeta = get_object_or_404(GiftCard, id=data['uuid'])

        if not tarjeta.activa:
            return Response({"error": "No se puede recargar una tarjeta bloqueada."}, status=status.HTTP_400_BAD_REQUEST)

        monto = data['monto']
        with transaction.atomic():
            tarjeta = GiftCard.objects.select_for_update().get(id=tarjeta.id)
            tarjeta.saldo += monto
            tarjeta.save()

            Transaccion.objects.create(
                card=tarjeta,
                monto=monto,
                tipo='CARGA',
                operador=request.user
            )

        return Response({
            "mensaje": f"Recarga de Q{monto} realizada exitosamente.",
            "nuevo_saldo": str(tarjeta.saldo),
            "monto_recargado": str(monto),
            "tarjeta_id": str(tarjeta.id)
        })

class EstadoCajaPOSView(APIView):
    """
    Devuelve el resumen de transacciones del día para el cajero actual.
    GET /api/pos/corte-caja/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.now().date()
        cierre_existente = CierreDiario.objects.filter(operador=request.user, fecha=hoy).first()

        ingresos = Transaccion.objects.select_related('card').filter(
            operador=request.user,
            fecha__date=hoy,
            tipo__in=['CARGA', 'ACTIVACION', 'CONSUMO']
        ).order_by('-fecha')

        cargas_hoy = ingresos.filter(tipo__in=['CARGA', 'ACTIVACION']).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        consumos_hoy = ingresos.filter(tipo='CONSUMO').aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        total_dia = ingresos.aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        cantidad_ops = ingresos.count()

        movimientos_data = []
        for mov in ingresos[:30]:
            movimientos_data.append({
                "id": mov.id,
                "tarjeta_id": str(mov.card.id)[:8] + "...",
                "tipo": mov.tipo,
                "monto": str(mov.monto),
                "fecha": mov.fecha.strftime("%H:%M:%S")
            })

        return Response({
            "fecha": hoy.strftime("%d/%m/%Y"),
            "cajero": request.user.get_full_name() or request.user.username,
            "total_recaudado": str(total_dia),
            "cargas_hoy": str(cargas_hoy),
            "consumos_hoy": str(consumos_hoy),
            "cantidad_operaciones": cantidad_ops,
            "caja_cerrada": cierre_existente is not None,
            "hora_cierre": cierre_existente.hora_cierre.strftime("%H:%M:%S") if cierre_existente else None,
            "movimientos": movimientos_data
        })

class CerrarCajaPOSView(APIView):
    """
    Ejecuta el cierre de caja diario, genera PDF y envía reporte por correo en segundo plano.
    POST /api/pos/corte-caja/cerrar/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        hoy = timezone.now().date()

        # Validar si ya se cerró
        if CierreDiario.objects.filter(operador=request.user, fecha=hoy).exists():
            return Response({
                "error": "La caja ya fue cerrada para el día de hoy. No se puede duplicar el cierre."
            }, status=status.HTTP_400_BAD_REQUEST)

        ingresos = Transaccion.objects.select_related('card').filter(
            operador=request.user,
            fecha__date=hoy,
            tipo__in=['CARGA', 'ACTIVACION', 'CONSUMO']
        ).order_by('-fecha')

        total_dia = ingresos.aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')
        cantidad_ops = ingresos.count()

        with transaction.atomic():
            cierre = CierreDiario.objects.create(
                operador=request.user,
                fecha=hoy,
                total_recaudado=total_dia,
                cantidad_operaciones=cantidad_ops
            )

        # Generar PDF y enviar correo asíncrono
        try:
            context = {
                'movimientos': ingresos,
                'total_dia': total_dia,
                'cantidad_ops': cantidad_ops,
                'fecha': hoy,
                'cajero': request.user
            }
            pdf = render_to_pdf('core/pdf_corte.html', context)
            if pdf and os.getenv('EMAIL_ADMIN'):
                asunto = f"📊 Cierre de Caja - {request.user.username} - {hoy}"
                email = EmailMessage(
                    asunto,
                    f"Se adjunta el corte de caja del día.\n\nTotal Operado: Q{total_dia}\nTransacciones: {cantidad_ops}",
                    settings.DEFAULT_FROM_EMAIL,
                    [os.getenv('EMAIL_ADMIN')],
                )
                email.attach(f'Corte_{hoy}.pdf', pdf, 'application/pdf')
                EmailThread(email).start()
        except Exception as e:
            print(f"Error generando reporte de corte: {e}")

        return Response({
            "mensaje": "Caja cerrada exitosamente. Reporte generado y enviado.",
            "total_dia": str(total_dia),
            "cantidad_operaciones": cantidad_ops,
            "hora_cierre": cierre.hora_cierre.strftime("%H:%M:%S")
        })
