from django.urls import path
from . import views

urlpatterns = [
    # 1. Ruta Raíz y ruta explicita /dashboard/
    path('', views.dashboard_cajero, name='dashboard'),
    path('dashboard/', views.dashboard_cajero, name='dashboard_alias'),
    
    # 2. Rutas de Acción
    path('cobrar/', views.procesar_cobro, name='cobrar'),
    path('recargar/', views.recargar_saldo, name='recargar'), # NUEVA
    path('crear/', views.crear_giftcard, name='crear_card'),
    path('tarjeta/<uuid:uuid>/', views.ver_qr, name='ver_qr'),
    path('transacciones/', views.historial_transacciones, name='transacciones'),
    path('lista-tarjetas/', views.lista_tarjetas, name='lista_tarjetas'),
]