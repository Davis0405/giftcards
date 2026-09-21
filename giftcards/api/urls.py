from django.urls import path
from .views import (
    CustomLoginView,
    UsuarioActualView,
    MiTarjetaView,
    AccionTarjetaView,
    RegistrarUsuarioView,
    HistorialTransaccionesView,
    CambiarPinView
)
from .views_pos import (
    ConsultarTarjetaPOSView,
    CobrarPOSView,
    RecargarPOSView,
    EstadoCajaPOSView,
    CerrarCajaPOSView
)
from .views_admin import (
    DashboardAdminView,
    ListarTarjetasAdminView,
    CrearTarjetaAdminView,
    BloquearTarjetaAdminView,
    ActualizarPinAdminView,
    EliminarTarjetaAdminView,
    TransaccionesAdminView,
    DescargarPDFTarjetaView
)

urlpatterns = [
    # =========================================================================
    # 1. AUTENTICACIÓN Y USUARIO
    # =========================================================================
    path('login/', CustomLoginView.as_view(), name='api_login'),
    path('auth/me/', UsuarioActualView.as_view(), name='api_user_me'),
    path('register/', RegistrarUsuarioView.as_view(), name='api_register'),

    # =========================================================================
    # 2. PORTAL DE CLIENTE / APP MÓVIL
    # =========================================================================
    path('mi-tarjeta/', MiTarjetaView.as_view(), name='api_mi_tarjeta'),
    path('mi-tarjeta/accion/', AccionTarjetaView.as_view(), name='api_accion_tarjeta'),
    path('mi-tarjeta/historial/', HistorialTransaccionesView.as_view(), name='api_historial'),
    path('mi-tarjeta/pin/', CambiarPinView.as_view(), name='api_cambiar_pin'),

    # =========================================================================
    # 3. TERMINAL DE PUNTO DE VENTA (POS / CAJEROS)
    # =========================================================================
    path('pos/tarjeta/<uuid:uuid>/', ConsultarTarjetaPOSView.as_view(), name='api_pos_consultar'),
    path('pos/cobrar/', CobrarPOSView.as_view(), name='api_pos_cobrar'),
    path('pos/recargar/', RecargarPOSView.as_view(), name='api_pos_recargar'),
    path('pos/corte-caja/', EstadoCajaPOSView.as_view(), name='api_pos_corte_caja'),
    path('pos/corte-caja/cerrar/', CerrarCajaPOSView.as_view(), name='api_pos_cerrar_caja'),

    # =========================================================================
    # 4. ADMINISTRACIÓN Y GERENCIA (DASHBOARD Y TARJETAS)
    # =========================================================================
    path('admin/dashboard/', DashboardAdminView.as_view(), name='api_admin_dashboard'),
    path('admin/tarjetas/', ListarTarjetasAdminView.as_view(), name='api_admin_tarjetas'),
    path('admin/tarjetas/crear/', CrearTarjetaAdminView.as_view(), name='api_admin_crear_tarjeta'),
    path('admin/tarjetas/<uuid:uuid>/bloquear/', BloquearTarjetaAdminView.as_view(), name='api_admin_bloquear_tarjeta'),
    path('admin/tarjetas/<uuid:uuid>/pin/', ActualizarPinAdminView.as_view(), name='api_admin_actualizar_pin'),
    path('admin/tarjetas/<uuid:uuid>/', EliminarTarjetaAdminView.as_view(), name='api_admin_eliminar_tarjeta'),
    path('admin/transacciones/', TransaccionesAdminView.as_view(), name='api_admin_transacciones'),
    path('tarjetas/<uuid:uuid>/pdf/', DescargarPDFTarjetaView.as_view(), name='api_descargar_pdf_tarjeta'),
]