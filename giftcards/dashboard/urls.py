# dashboard/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Esta será la ruta raíz del dashboard
    path('', views.index, name='dashboard_index'),
]