from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views # Asegúrate de tener este import
from django.conf import settings
from django.conf.urls.static import static
from dashboard import views as dash_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rutas de Autenticación
    path('accounts/login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    
    # AQUÍ ESTÁ EL CAMBIO: Agregamos next_page='login'
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),

    # 2. DASHBOARD (Es tu página de inicio)
    path('', dash_views.index, name='dashboard'),

    path('', include('core.urls')),

    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)