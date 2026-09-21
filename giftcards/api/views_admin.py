from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Q
from django.core.paginator import Paginator
from django.contrib.auth.models import User
from django.http import HttpResponse
from decimal import Decimal
import random
from datetime import timedelta
import os
import base64
from xhtml2pdf import pisa
from django.template.loader import render_to_string
from io import BytesIO
from django.conf import settings

from core.models import GiftCard, Transaccion
from core.views import EmailWithPDFThread
from .serializers import (
    GiftCardAdminSerializer,
    CrearGiftCardSerializer,
    TransaccionAdminSerializer
)

class EsStaffPermission(IsAuthenticated):
    def has_permission(self, request, view):
        is_auth = super().has_permission(request, view)
        return is_auth and (request.user.is_staff or request.user.groups.filter(name='Gerencia').exists())

class ListarTarjetasAdminView(APIView):
    """
    Listado paginado de tarjetas con filtros, búsqueda y estadísticas globales.
    GET /api/admin/tarjetas/?page=1&search=...&status=active|blocked|depleted
    """
    permission_classes = [EsStaffPermission]

    def get(self, request):
        search_query = request.GET.get('search', '').strip()
        status_filter = request.GET.get('status', '')
        page_num = request.GET.get('page', 1)
        page_size = int(request.GET.get('page_size', 20))

        queryset = GiftCard.objects.select_related('dueno').prefetch_related('movimientos').all()

        if search_query:
            queryset = queryset.filter(
                Q(id__icontains=search_query) |
                Q(dueno__username__icontains=search_query) |
                Q(dueno__email__icontains=search_query) |
                Q(email_cliente__icontains=search_query) |
                Q(saldo__icontains=search_query)
            )

        if status_filter == 'active':
            queryset = queryset.filter(activa=True, saldo__gt=0)
        elif status_filter == 'blocked':
            queryset = queryset.filter(activa=False)
        elif status_filter == 'depleted':
            queryset = queryset.filter(activa=True, saldo=0)

        queryset = queryset.order_by('-fecha_creacion')

        # Paginación
        paginator = Paginator(queryset, page_size)
        pagina = paginator.get_page(page_num)

        # Estadísticas globales
        todas = GiftCard.objects.all()
        stats = {
            'total': todas.count(),
            'activas': todas.filter(activa=True, saldo__gt=0).count(),
            'bloqueadas': todas.filter(activa=False).count(),
            'saldo_total': str(todas.aggregate(Sum('saldo'))['saldo__sum'] or Decimal('0.00')),
        }

        serializer = GiftCardAdminSerializer(pagina.object_list, many=True)

        return Response({
            "tarjetas": serializer.data,
            "paginacion": {
                "total_items": paginator.count,
                "total_paginas": paginator.num_pages,
                "pagina_actual": pagina.number,
                "tiene_siguiente": pagina.has_next(),
                "tiene_anterior": pagina.has_previous(),
            },
            "estadisticas": stats
        })

class CrearTarjetaAdminView(APIView):
    """
    Emisión administrativa de nuevas tarjetas con envío de correo en segundo plano.
    POST /api/admin/tarjetas/crear/
    Body: { "saldo": 150.00, "fecha_vencimiento": "2027-01-01", "pin": "1234", "email_cliente": "cliente@email.com" }
    """
    permission_classes = [EsStaffPermission]

    def post(self, request):
        serializer = CrearGiftCardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        pin = data.get('pin') or str(random.randint(1000, 9999))
        vencimiento = data.get('fecha_vencimiento') or (timezone.now().date() + timedelta(days=365))
        email_cliente = data.get('email_cliente')
        saldo = data.get('saldo', Decimal('0.00'))

        # Auto-asociación si el email ya pertenece a un usuario
        dueno = None
        if email_cliente:
            dueno = User.objects.filter(email=email_cliente).first()

        nueva_tarjeta = GiftCard.objects.create(
            saldo=saldo,
            fecha_vencimiento=vencimiento,
            pin=pin,
            dueno=dueno,
            email_cliente=email_cliente,
            activa=True
        )

        # Transacción de activación inicial si cuenta con saldo
        if saldo > 0:
            Transaccion.objects.create(
                card=nueva_tarjeta,
                monto=saldo,
                tipo='ACTIVACION',
                operador=request.user
            )

        # Enviar correo en segundo plano si hay email
        if email_cliente:
            try:
                EmailWithPDFThread(nueva_tarjeta, request).start()
            except Exception as e:
                print(f"Error iniciando envío de correo: {e}")

        response_serializer = GiftCardAdminSerializer(nueva_tarjeta)
        return Response({
            "mensaje": "Tarjeta creada exitosamente.",
            "tarjeta": response_serializer.data,
            "pin": pin
        }, status=status.HTTP_201_CREATED)

class BloquearTarjetaAdminView(APIView):
    """
    Alterna el estado bloqueada / activa de una tarjeta.
    PATCH /api/admin/tarjetas/<uuid:uuid>/bloquear/
    """
    permission_classes = [EsStaffPermission]

    def patch(self, request, uuid):
        tarjeta = get_object_or_404(GiftCard, id=uuid)
        tarjeta.activa = not tarjeta.activa
        tarjeta.save()

        estado = "ACTIVADA" if tarjeta.activa else "BLOQUEADA"
        return Response({
            "mensaje": f"Tarjeta {estado} exitosamente.",
            "activa": tarjeta.activa,
            "id": str(tarjeta.id)
        })

class ActualizarPinAdminView(APIView):
    """
    Actualiza administrativamente el PIN de una tarjeta.
    PATCH /api/admin/tarjetas/<uuid:uuid>/pin/
    Body: { "pin_nuevo": "5678" }
    """
    permission_classes = [EsStaffPermission]

    def patch(self, request, uuid):
        pin_nuevo = request.data.get('pin_nuevo', '')
        if len(pin_nuevo) != 4 or not pin_nuevo.isdigit():
            return Response({"error": "El PIN debe tener 4 dígitos numéricos."}, status=status.HTTP_400_BAD_REQUEST)

        tarjeta = get_object_or_404(GiftCard, id=uuid)
        tarjeta.pin = pin_nuevo
        tarjeta.save()

        return Response({
            "mensaje": "PIN actualizado correctamente.",
            "id": str(tarjeta.id)
        })

class EliminarTarjetaAdminView(APIView):
    """
    Elimina una tarjeta únicamente si no tiene transacciones asociadas.
    DELETE /api/admin/tarjetas/<uuid:uuid>/
    """
    permission_classes = [EsStaffPermission]

    def delete(self, request, uuid):
        tarjeta = get_object_or_404(GiftCard, id=uuid)
        if tarjeta.movimientos.exists():
            return Response({
                "error": "No se puede eliminar la tarjeta porque cuenta con historial financiero. Debes bloquearla."
            }, status=status.HTTP_400_BAD_REQUEST)

        tarjeta.delete()
        return Response({"mensaje": "Tarjeta eliminada exitosamente del sistema."})

class DashboardAdminView(APIView):
    """
    Métricas ejecutivas para el Dashboard gerencial.
    GET /api/admin/dashboard/
    """
    permission_classes = [EsStaffPermission]

    def get(self, request):
        hoy = timezone.now().date()
        total_tarjetas = GiftCard.objects.count()
        tarjetas_activas = GiftCard.objects.filter(activa=True).count()
        saldo_circulante = GiftCard.objects.filter(activa=True).aggregate(Sum('saldo'))['saldo__sum'] or Decimal('0.00')

        ventas_hoy = Transaccion.objects.filter(
            fecha__date=hoy,
            tipo__in=['CARGA', 'ACTIVACION']
        ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

        consumos_hoy = Transaccion.objects.filter(
            fecha__date=hoy,
            tipo='CONSUMO'
        ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

        ultima_tx = Transaccion.objects.order_by('-fecha').first()

        # Resumen de últimos 7 días
        hace_7_dias = hoy - timedelta(days=6)
        ventas_semana = Transaccion.objects.filter(
            fecha__date__gte=hace_7_dias,
            tipo__in=['CARGA', 'ACTIVACION']
        ).aggregate(Sum('monto'))['monto__sum'] or Decimal('0.00')

        return Response({
            "total_tarjetas": total_tarjetas,
            "tarjetas_activas": tarjetas_activas,
            "saldo_circulante": str(saldo_circulante),
            "ventas_hoy": str(ventas_hoy),
            "consumos_hoy": str(consumos_hoy),
            "ventas_ultimos_7_dias": str(ventas_semana),
            "ultima_transaccion": ultima_tx.fecha.strftime("%d/%m/%Y %H:%M") if ultima_tx else None
        })

class TransaccionesAdminView(APIView):
    """
    Historial de auditoría para administradores con filtros.
    GET /api/admin/transacciones/?tipo=CONSUMO|CARGA|ACTIVACION&limit=50
    """
    permission_classes = [EsStaffPermission]

    def get(self, request):
        tipo = request.GET.get('tipo', '')
        limit = int(request.GET.get('limit', 50))

        queryset = Transaccion.objects.select_related('card', 'card__dueno', 'operador').all()
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        movimientos = queryset.order_by('-fecha')[:limit]
        serializer = TransaccionAdminSerializer(movimientos, many=True)
        return Response(serializer.data)

class DescargarPDFTarjetaView(APIView):
    """
    Genera y descarga el PDF imprimible de una tarjeta.
    GET /api/tarjetas/<uuid:uuid>/pdf/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        tarjeta = get_object_or_404(GiftCard, id=uuid)

        # Si no es staff, solo el dueño puede descargarla
        if not request.user.is_staff and tarjeta.dueno != request.user:
            return Response({"error": "No tienes permiso para descargar esta tarjeta."}, status=status.HTTP_403_FORBIDDEN)

        qr_base64 = None
        try:
            qr_path = os.path.join(settings.MEDIA_ROOT, tarjeta.qr_image.name)
            with open(qr_path, 'rb') as img_file:
                qr_base64 = f"data:image/png;base64,{base64.b64encode(img_file.read()).decode('utf-8')}"
        except Exception as e:
            print(f"Error cargando QR: {e}")

        html_string = render_to_string('core/pdf_tarjeta.html', {
            'tarjeta': tarjeta,
            'qr_base64': qr_base64,
            'base_url': f"{request.scheme}://{request.get_host()}"
        })

        result = BytesIO()
        pdf_status = pisa.pisaDocument(BytesIO(html_string.encode("UTF-8")), result)

        if pdf_status.err:
            return Response({"error": "Error generando PDF"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = HttpResponse(result.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="GiftCard_{tarjeta.id}.pdf"'
        return response
