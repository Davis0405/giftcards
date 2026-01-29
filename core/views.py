from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import GiftCard, Transaccion
from django.db import transaction
from .forms import GiftCardForm
from decimal import Decimal  # <--- IMPORTANTE: Agregamos esto para manejar dinero

@login_required
def dashboard_cajero(request):
    return render(request, 'core/dashboard.html')

@login_required
def procesar_cobro(request):
    uuid_tarjeta = request.GET.get('uuid') or request.POST.get('uuid')
    
    # Validación: Si no hay UUID, volver al dashboard
    if not uuid_tarjeta:
        messages.warning(request, "Debes escanear un código primero.")
        return redirect('dashboard')

    tarjeta = get_object_or_404(GiftCard, id=uuid_tarjeta)
    
    if request.method == 'POST':
        try:
            # Convertimos el texto a Decimal para calculos financieros exactos
            monto = Decimal(request.POST.get('monto'))
            
            if monto <= 0:
                messages.error(request, "El monto debe ser mayor a 0.")
            elif tarjeta.saldo >= monto:
                with transaction.atomic():
                    # AQUÍ ESTABA EL ERROR: Ahora restamos limpio
                    tarjeta.saldo -= monto
                    tarjeta.save()
                    
                    Transaccion.objects.create(
                        card=tarjeta, 
                        monto=monto, 
                        tipo='CONSUMO', 
                        operador=request.user
                    )
                messages.success(request, f"Cobro de Q{monto} exitoso. Nuevo saldo: Q{tarjeta.saldo}")
                return redirect('dashboard')
            else:
                messages.error(request, f"Saldo insuficiente. Solo tiene Q{tarjeta.saldo}")
        except Exception as e:
            messages.error(request, f"Error en el monto: {e}")

    return render(request, 'core/cobro.html', {'tarjeta': tarjeta})

@login_required
def recargar_saldo(request):
    uuid_tarjeta = request.GET.get('uuid') or request.POST.get('uuid')
    if not uuid_tarjeta:
        messages.warning(request, "Escanea un código para recargar.")
        return redirect('dashboard')

    tarjeta = get_object_or_404(GiftCard, id=uuid_tarjeta)

    if request.method == 'POST':
        try:
            monto = Decimal(request.POST.get('monto'))
            if monto > 0:
                with transaction.atomic():
                    tarjeta.saldo += monto
                    tarjeta.save()
                    Transaccion.objects.create(
                        card=tarjeta, 
                        monto=monto, 
                        tipo='CARGA', 
                        operador=request.user
                    )
                messages.success(request, f"Recarga de Q{monto} exitosa.")
                return redirect('dashboard')
            else:
                messages.error(request, "El monto debe ser positivo.")
        except:
             messages.error(request, "Monto inválido.")

    return render(request, 'core/recargar.html', {'tarjeta': tarjeta})

@login_required
def crear_giftcard(request):
    if not request.user.is_staff:
        messages.error(request, "No tienes permisos.")
        return redirect('dashboard')

    if request.method == 'POST':
        form = GiftCardForm(request.POST)
        if form.is_valid():
            nueva_tarjeta = form.save()
            messages.success(request, "Tarjeta creada exitosamente.")
            return redirect('ver_qr', uuid=nueva_tarjeta.id)
    else:
        form = GiftCardForm()

    return render(request, 'core/crear_tarjeta.html', {'form': form})

@login_required
def ver_qr(request, uuid):
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    return render(request, 'core/ver_qr.html', {'tarjeta': tarjeta})

@login_required
def historial_transacciones(request):
    # Obtenemos las últimas 50 transacciones (orden inverso por fecha)
    movimientos = Transaccion.objects.select_related('card', 'operador').all().order_by('-fecha')[:50]
    
    return render(request, 'core/transacciones.html', {'movimientos': movimientos})

# core/views.py

@login_required
def lista_tarjetas(request):
    # Solo el staff (admin) puede ver todas las tarjetas
    if not request.user.is_staff:
        messages.error(request, "Acceso restringido.")
        return redirect('dashboard')

    # Obtenemos todas, ordenadas por fecha de creación (descendente)
    tarjetas = GiftCard.objects.all().order_by('-fecha_creacion')
    
    return render(request, 'core/lista_tarjetas.html', {'tarjetas': tarjetas})