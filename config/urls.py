from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# --- IMPORTS PARA SWAGGER ---
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="API Gift Cards Premium ☕",
      default_version='v1',
      description="API REST Oficial para Cafetería Premium (React Web SPA & Mobile App)",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="soporte@cafeteria.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

def api_welcome(request):
    return JsonResponse({
        "status": "online",
        "service": "Cafetería Premium - Gift Cards Backend API",
        "version": "1.0.0",
        "api_docs": "/swagger/",
        "endpoints": {
            "auth": "/api/login/",
            "user": "/api/auth/me/",
            "pos": "/api/pos/",
            "admin": "/api/admin/",
        }
    })

urlpatterns = [
    # 1. API Status Root
    path('', api_welcome, name='api_root'),

    # 2. Django Admin
    path('admin/', admin.site.urls),

    # 3. API REST Principal
    path('api/', include('api.urls')),

    # 4. Documentación Interactiva (Swagger / ReDoc)
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Servir archivos media (QRs generados) en DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)