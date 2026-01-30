from django.urls import path
from . import views

urlpatterns = [
    # --- Vistas Principales ---
    path('', views.dashboard_general, name='dashboard'),      # Menú Principal (Iconos)
    path('terminal/', views.terminal_pos, name='terminal'),   # Escáner/Caja (Pantalla de trabajo)

    # --- Operaciones Transaccionales ---
    path('cobrar/', views.procesar_cobro, name='cobrar'),
    path('recargar/', views.recargar_saldo, name='recargar'),
    path('transacciones/', views.historial_transacciones, name='transacciones'),

    # --- Gestión Administrativa (Staff) ---
    path('lista-tarjetas/', views.lista_tarjetas, name='lista_tarjetas'),
    path('crear/', views.crear_giftcard, name='crear_card'),
    
    # --- Acciones sobre Recursos (REST-style pero en vistas) ---
    path('tarjeta/<uuid:uuid>/qr/', views.ver_qr, name='ver_qr'),
    path('tarjeta/<uuid:uuid>/pin/', views.cambiar_pin, name='cambiar_pin'),
    path('tarjeta/<uuid:uuid>/bloquear/', views.bloquear_tarjeta, name='bloquear_tarjeta'),
    path('tarjeta/<uuid:uuid>/eliminar/', views.eliminar_tarjeta, name='eliminar_tarjeta'),
    path('corte-caja/', views.corte_caja, name='corte_caja'),
    path('tarjeta/<uuid:uuid>/pdf/', views.generar_pdf, name='generar_pdf'),
]