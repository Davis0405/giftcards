# dashboard/views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.utils import timezone

# Importamos los modelos desde la otra app 'core'
from core.models import GiftCard, Transaccion

@login_required
def index(request):
    """
    Vista principal del Dashboard.
    Antes se llamaba 'dashboard_general' en core.
    """
    hoy = timezone.localdate()
    context = {}

    if request.user.is_staff:
        # Lógica de Gerente
        context['total_tarjetas'] = GiftCard.objects.count()
        
        ventas_hoy = Transaccion.objects.filter(
            fecha__date=hoy,
            tipo__in=['CARGA', 'ACTIVACION']
        ).aggregate(Sum('monto'))['monto__sum']
        
        context['ventas_hoy'] = ventas_hoy or 0
        
        ultima_tx = Transaccion.objects.all().order_by('-fecha').first()
        context['ultima_transaccion'] = ultima_tx.fecha if ultima_tx else None

    else:
        # Lógica de Cajero
        context['total_tarjetas'] = "-" 
        
        ventas_mi_caja = Transaccion.objects.filter(
            operador=request.user,
            fecha__date=hoy,
            tipo__in=['CARGA', 'ACTIVACION']
        ).aggregate(Sum('monto'))['monto__sum']
        
        context['ventas_hoy'] = ventas_mi_caja or 0
        
        ultima_tx = Transaccion.objects.filter(operador=request.user).order_by('-fecha').first()
        context['ultima_transaccion'] = ultima_tx.fecha if ultima_tx else None

    # Nota el cambio de ruta del template
    return render(request, 'dashboard/index.html', context)