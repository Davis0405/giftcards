from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static
from dashboard import views as dash_views

# --- IMPORTS PARA SWAGGER ---
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Configuración de la información de tu API
schema_view = get_schema_view(
   openapi.Info(
      title="API Gift Cards Premium ☕",
      default_version='v1',
      description="Documentación oficial para la App Móvil de Cafetería Premium",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="soporte@cafeteria.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # 1. ADMIN
    path('admin/', admin.site.urls),

    # 2. AUTENTICACIÓN (Login/Logout personalizados)
    path('accounts/login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # 3. DASHBOARD (Inicio)
    path('', dash_views.index, name='dashboard'), 

    # 4. CORE (Resto de la app web)
    path('', include('core.urls')),
    
    # 5. API (Backend Móvil)
    path('api/', include('api.urls')),

    # 6. DOCUMENTACIÓN (Swagger/Redoc)
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Configuración de archivos media (Imágenes QR) en modo DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)