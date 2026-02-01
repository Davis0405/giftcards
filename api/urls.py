from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import MiTarjetaView, AccionTarjetaView

urlpatterns = [
    # 1. LOGIN (Te da un Token a cambio de usuario/pass)
    path('login/', obtain_auth_token, name='api_login'),
    
    # 2. VER TARJETA Y SALDO
    path('mi-tarjeta/', MiTarjetaView.as_view(), name='api_mi_tarjeta'),
    
    # 3. BLOQUEAR/DESBLOQUEAR
    path('mi-tarjeta/accion/', AccionTarjetaView.as_view(), name='api_accion_tarjeta'),
]