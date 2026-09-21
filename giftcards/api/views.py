from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from core.models import GiftCard, Transaccion
from .serializers import (
    CambioPinSerializer,
    GiftCardSerializer,
    TransaccionSerializer,
    RegistroUsuarioSerializer,
    UserSerializer
)
from django.db import transaction 
from rest_framework.authtoken.models import Token
import random
from datetime import timedelta 
from django.utils import timezone 
from django.contrib.auth.models import User, Group

class CustomLoginView(APIView):
    """
    Inicia sesión y devuelve el token junto con el perfil y roles del usuario.
    POST /api/login/
    Body: { "username": "admin", "password": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"error": "Debes ingresar usuario y contraseña."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Credenciales inválidas. Verifica tu usuario y contraseña."}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        user_serializer = UserSerializer(user)

        return Response({
            "token": token.key,
            "user": user_serializer.data,
            "mensaje": f"Bienvenido, {user.get_full_name() or user.username}"
        })

class UsuarioActualView(APIView):
    """
    Devuelve los datos y roles del usuario con la sesión activa.
    GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class MiTarjetaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Buscamos tarjeta del usuario
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        
        # Fallback para usuarios antiguos sin dueño asignado
        if not tarjeta and request.user.email:
             tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()
             if tarjeta:
                 tarjeta.dueno = request.user
                 tarjeta.save()
    
        if not tarjeta:
            return Response({"error": "No tienes una tarjeta asociada."}, status=404)

        serializer = GiftCardSerializer(tarjeta)
        return Response(serializer.data)

class AccionTarjetaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        if not tarjeta and request.user.email:
            tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()
            if tarjeta:
                tarjeta.dueno = request.user
                tarjeta.save()

        if not tarjeta:
            return Response({"error": "No se encontró tarjeta."}, status=404)

        accion = request.data.get('accion')

        if accion == 'bloquear':
            tarjeta.activa = False
            tarjeta.save()
            return Response({"mensaje": "Tarjeta BLOQUEADA", "activa": False, "saldo": str(tarjeta.saldo)})
        
        elif accion == 'activar':
            tarjeta.activa = True
            tarjeta.save()
            return Response({"mensaje": "Tarjeta ACTIVADA", "activa": True, "saldo": str(tarjeta.saldo)})
            
        return Response({"error": "Acción no válida."}, status=400)
    
class RegistrarUsuarioView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroUsuarioSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    nuevo_usuario = serializer.save()
                    
                    # Asignar Grupo Clientes
                    try:
                        grupo_clientes, _ = Group.objects.get_or_create(name='Clientes')
                        nuevo_usuario.groups.add(grupo_clientes)
                    except Exception as e:
                        print(f"Advertencia Grupo: {e}")

                    # Crear GiftCard
                    pin_random = str(random.randint(1000, 9999))
                    vencimiento = timezone.now().date() + timedelta(days=365)
                    
                    tarjeta = GiftCard.objects.create(
                        dueno=nuevo_usuario,
                        email_cliente=nuevo_usuario.email,
                        saldo=0.00,
                        pin=pin_random,
                        activa=True,
                        fecha_vencimiento=vencimiento
                    )
                    
                    token, _ = Token.objects.get_or_create(user=nuevo_usuario)
                    
                    return Response({
                        "mensaje": "¡Cuenta creada!",
                        "token": token.key,
                        "usuario": nuevo_usuario.username,
                        "tarjeta_id": tarjeta.id,
                        "pin_inicial": pin_random,
                        "grupo": "Clientes"
                    }, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({"error": f"Error interno: {str(e)}"}, status=500)
        
        return Response(serializer.errors, status=400)
    
class HistorialTransaccionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        
        if not tarjeta:
            # Intento secundario
            if request.user.email:
                tarjeta = GiftCard.objects.filter(email_cliente=request.user.email).first()

        if not tarjeta:
            return Response({"error": "No tienes tarjeta asociada"}, status=404)

        # ⚡ OPTIMIZACIÓN CLAVE PARA RENDIMIENTO ⚡
        # select_related evita que Django haga 20 consultas extras a la base de datos
        movimientos = Transaccion.objects.filter(card=tarjeta).select_related('operador').order_by('-fecha')[:20]
        
        serializer = TransaccionSerializer(movimientos, many=True)
        return Response(serializer.data)

class CambiarPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambioPinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        tarjeta = GiftCard.objects.filter(dueno=request.user).first()
        if not tarjeta: return Response({"error": "No encontrada"}, status=404)

        if tarjeta.pin != serializer.validated_data['pin_actual']:
            return Response({"error": "PIN incorrecto"}, status=400)

        tarjeta.pin = serializer.validated_data['pin_nuevo']
        tarjeta.save()

        return Response({"mensaje": "PIN actualizado"})