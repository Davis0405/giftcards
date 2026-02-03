from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from core.models import GiftCard
from .serializers import CambioPinSerializer, GiftCardSerializer, TransaccionSerializer
from django.db import transaction # <--- Importante para la seguridad de datos
from rest_framework.authtoken.models import Token
from .serializers import RegistroUsuarioSerializer
import random
from core.models import Transaccion
from datetime import timedelta  # <--- AGREGAR
from django.utils import timezone # <--- AGREGAR
from django.contrib.auth.models import User, Group
from datetime import timedelta
from rest_framework.permissions import AllowAny

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
    
# 4. REGISTRO DE USUARIOS + CREACIÓN DE TARJETA AUTOMÁTICA
class RegistrarUsuarioView(APIView):
    """
    Crea usuario + Asigna Grupo 'Clientes' + Crea GiftCard + Token.
    Acceso público (AllowAny).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroUsuarioSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic(): # Si algo falla, deshace todo
                    # 1. Crear Usuario
                    nuevo_usuario = serializer.save()
                    
                    # 2. ASIGNAR GRUPO "Clientes" (A prueba de balas 🛡️)
                    # get_or_create: Si el grupo no existe, lo crea y lo asigna.
                    try:
                        grupo_clientes, created = Group.objects.get_or_create(name='Clientes')
                        nuevo_usuario.groups.add(grupo_clientes)
                    except Exception as e:
                        print(f"Advertencia: No se pudo asignar grupo: {e}")

                    # 3. Configurar GiftCard (PIN y Vencimiento)
                    pin_random = str(random.randint(1000, 9999))
                    vencimiento_default = timezone.now().date() + timedelta(days=365)
                    
                    # 4. Crear la Tarjeta
                    tarjeta = GiftCard.objects.create(
                        dueno=nuevo_usuario,
                        email_cliente=nuevo_usuario.email, # Respaldo
                        saldo=0.00,
                        pin=pin_random,
                        activa=True,
                        fecha_vencimiento=vencimiento_default
                    )
                    
                    # 5. Generar Token (Auto-Login)
                    token, _ = Token.objects.get_or_create(user=nuevo_usuario)
                    
                    return Response({
                        "mensaje": "¡Cuenta creada exitosamente!",
                        "token": token.key,
                        "usuario": nuevo_usuario.username,
                        "tarjeta_id": tarjeta.id,
                        "pin_inicial": pin_random,
                        "vencimiento": tarjeta.fecha_vencimiento,
                        "grupo": "Clientes"
                    }, status=status.HTTP_201_CREATED)

            except Exception as e:
                # Capturamos cualquier error inesperado
                return Response({"error": f"Error interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class HistorialTransaccionesView(APIView):
    """
    Devuelve los últimos 20 movimientos de la tarjeta del usuario.
    GET /api/mi-tarjeta/historial/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Buscamos la tarjeta (Usando nuestra lógica segura)
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        
        # Retro-compatibilidad email (por si acaso)
        if not tarjeta and request.user.email:
             tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()

        if not tarjeta:
            return Response({"error": "No tienes tarjeta asociada"}, status=404)

        # 2. Buscamos las transacciones de ESA tarjeta
        # Order_by '-fecha' significa: Las más nuevas primero
        movimientos = Transaccion.objects.filter(card=tarjeta).order_by('-fecha')[:20]
        
        serializer = TransaccionSerializer(movimientos, many=True)
        return Response(serializer.data)
    
class CambiarPinView(APIView):
    """
    Permite cambiar el PIN de seguridad.
    POST /api/mi-tarjeta/pin/
    Body: { "pin_actual": "1234", "pin_nuevo": "9999" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Validar formato de los datos
        serializer = CambioPinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # 2. Buscar Tarjeta
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        if not tarjeta:
             # Fallback por email
             tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()

        if not tarjeta:
            return Response({"error": "No tienes tarjeta asociada"}, status=404)

        # 3. Verificar PIN Actual
        pin_actual_enviado = serializer.validated_data['pin_actual']
        if tarjeta.pin != pin_actual_enviado:
            return Response({"error": "El PIN actual es incorrecto ⛔"}, status=400)

        # 4. Guardar Nuevo PIN
        nuevo_pin = serializer.validated_data['pin_nuevo']
        tarjeta.pin = nuevo_pin
        tarjeta.save()

        return Response({
            "mensaje": "¡PIN actualizado correctamente! 🔐",
            "nuevo_pin": nuevo_pin # Opcional devolverlo
        })