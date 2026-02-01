from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import CambiarPinView, HistorialTransaccionesView, MiTarjetaView, AccionTarjetaView, RegistrarUsuarioView

urlpatterns = [
    # 1. LOGIN (Te da un Token a cambio de usuario/pass)
    path('login/', obtain_auth_token, name='api_login'),
    
    # 2. VER TARJETA Y SALDO
    path('mi-tarjeta/', MiTarjetaView.as_view(), name='api_mi_tarjeta'),
    
    # 3. BLOQUEAR/DESBLOQUEAR
    path('mi-tarjeta/accion/', AccionTarjetaView.as_view(), name='api_accion_tarjeta'),

    # 4. REGISTRAR USUARIO
    path('register/', RegistrarUsuarioView.as_view(), name='api_register'),

    # 5. HISTORIAL DE TRANSACCIONES
    path('mi-tarjeta/historial/', HistorialTransaccionesView.as_view(), name='api_historial'),

    # 6. CAMBIAR PIN
    path('mi-tarjeta/pin/', CambiarPinView.as_view(), name='api_cambiar_pin'),
]