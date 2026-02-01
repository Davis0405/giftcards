from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from core.models import GiftCard
from .serializers import GiftCardSerializer

class MiTarjetaView(APIView):
    """
    Endpoint inteligente: Busca por Dueño ID primero, luego por Email.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. INTENTO PRINCIPAL: Buscar por relación directa (Seguro)
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        
        # 2. PLAN B: Si no tiene dueño asignado, intentamos por email (Retro-compatibilidad)
        # Esto es útil para tarjetas viejas que creaste antes de este cambio
        if not tarjeta and request.user.email:
             tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()
             
             # AUTO-CORRECCIÓN: Si la encontramos por email, ¡la vinculamos de una vez!
             if tarjeta:
                 tarjeta.dueno = request.user
                 tarjeta.save()
    
        if not tarjeta:
            return Response({"error": "No tienes una tarjeta asociada."}, status=404)

        serializer = GiftCardSerializer(tarjeta)
        return Response(serializer.data)

class AccionTarjetaView(APIView):
    """
    Endpoint para Bloquear/Desbloquear.
    POST /api/mi-tarjeta/accion/
    Body: { "accion": "bloquear" } o { "accion": "activar" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. BÚSQUEDA INTELIGENTE (Igual que en MiTarjetaView)
        # Primero intentamos por la relación fuerte (Dueño)
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        
        # Si no aparece, intentamos por el correo (Plan B para tarjetas viejas)
        if not tarjeta and request.user.email:
            tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()
            
            # AUTO-VINCULACIÓN:
            # Si la encontramos por correo, aprovechamos para asignarle el dueño de una vez.
            # Así la próxima vez la búsqueda será rápida y segura.
            if tarjeta:
                tarjeta.dueno = request.user
                tarjeta.save()

        # Si después de todo esto no aparece...
        if not tarjeta:
            return Response({"error": "No se encontró ninguna tarjeta asociada a tu cuenta."}, status=404)

        # 2. PROCESAR LA ACCIÓN
        accion = request.data.get('accion')

        if accion == 'bloquear':
            tarjeta.activa = False
            tarjeta.save()
            return Response({
                "mensaje": "Tarjeta BLOQUEADA exitosamente", 
                "activa": False,
                "saldo": str(tarjeta.saldo) # Devolvemos el saldo para confirmar visualmente
            })
        
        elif accion == 'activar':
            tarjeta.activa = True
            tarjeta.save()
            return Response({
                "mensaje": "Tarjeta ACTIVADA exitosamente", 
                "activa": True,
                "saldo": str(tarjeta.saldo)
            })
            
        return Response({"error": "Acción no válida. Usa 'bloquear' o 'activar'"}, status=400)