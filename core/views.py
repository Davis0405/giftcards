from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import GiftCard, Transaccion
from django.db import transaction
from .forms import GiftCardForm
from decimal import Decimal #para manejar dinero
import random


@login_required
def dashboard_general(request):
    """
    Renderiza el Menú Principal (Dashboard).
    Archivo esperado: templates/core/dashboard.html
    """
    return render(request, 'core/dashboard.html')

@login_required
def terminal_pos(request):
    """
    Renderiza la Terminal de Punto de Venta (Escáner).
    Archivo esperado: templates/core/terminal.html
    """
    return render(request, 'core/terminal.html')

@login_required
def dashboard_cajero(request):
    return render(request, 'core/dashboard.html')

@login_required
def procesar_cobro(request):
    # 1. Obtener el UUID (ya sea por URL o por POST)
    uuid_tarjeta = request.GET.get('uuid') or request.POST.get('uuid')
    
    # Validación: Si no hay UUID, regresar al dashboard para evitar errores
    if not uuid_tarjeta:
        messages.warning(request, "Debes escanear un código primero.")
        return redirect('dashboard')

    # 2. Buscar la tarjeta en la BD
    tarjeta = get_object_or_404(GiftCard, id=uuid_tarjeta)
    
    # 3. Procesar el formulario cuando le dan "Cobrar"
    if request.method == 'POST':
        try:
            # Convertimos datos recibidos
            monto = Decimal(request.POST.get('monto'))
            pin_ingresado = request.POST.get('pin') # <-- NUEVO: Recibimos el PIN
            
            # --- INICIO VALIDACIÓN DE SEGURIDAD (PIN) ---
            # Si el PIN no coincide, detenemos todo y mostramos error
            if pin_ingresado != tarjeta.pin:
                messages.error(request, "❌ PIN INCORRECTO. Transacción rechazada.")
                # Regresamos a la misma pantalla para que intente de nuevo
                return render(request, 'core/cobro.html', {'tarjeta': tarjeta})
            # --- FIN VALIDACIÓN ---

            # --- VALIDACIONES DE DINERO ---
            if monto <= 0:
                messages.error(request, "El monto debe ser mayor a 0.")
            
            elif tarjeta.saldo >= monto:
                # Transacción Atómica: O se hace todo o no se hace nada
                with transaction.atomic():
                    tarjeta.saldo -= monto
                    tarjeta.save()
                    
                    Transaccion.objects.create(
                        card=tarjeta, 
                        monto=monto, 
                        tipo='CONSUMO', 
                        operador=request.user
                    )
                
                messages.success(request, f"✅ Cobro de Q{monto} exitoso. Nuevo saldo: Q{tarjeta.saldo}")
                return redirect('dashboard')
            
            else:
                messages.error(request, f"⚠️ Saldo insuficiente. Disponible: Q{tarjeta.saldo}")

        except Exception as e:
            # Captura errores de conversión (ej. si escriben letras en el monto)
            messages.error(request, f"Error en los datos: {e}")

    # 4. Si es GET (mostrar la pantalla de cobro)
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
        pin_aleatorio = str(random.randint(1000, 9999))
        form = GiftCardForm(initial={'pin': pin_aleatorio})

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

@login_required
def cambiar_pin(request, uuid):
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    
    if request.method == 'POST':
        nuevo_pin = request.POST.get('nuevo_pin')
        # Validación simple: que sean 4 dígitos numéricos
        if len(nuevo_pin) == 4 and nuevo_pin.isdigit():
            tarjeta.pin = nuevo_pin
            tarjeta.save()
            messages.success(request, "PIN actualizado correctamente.")
            return redirect('lista_tarjetas')
        else:
            messages.error(request, "El PIN debe tener 4 números.")
            
    return render(request, 'core/cambiar_pin.html', {'tarjeta': tarjeta})

@login_required
def bloquear_tarjeta(request, uuid):
    """Alterna entre Bloqueada/Desbloqueada"""
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    
    # Invertimos el estado (Si era True pasa a False y viceversa)
    tarjeta.activa = not tarjeta.activa
    tarjeta.save()
    
    estado = "ACTIVADA" if tarjeta.activa else "BLOQUEADA"
    # Usamos un mensaje diferente según el estado
    if tarjeta.activa:
        messages.success(request, f"Tarjeta {estado} exitosamente.")
    else:
        messages.warning(request, f"Tarjeta {estado}. No podrá usarse para cobros.")
        
    return redirect('lista_tarjetas')

@login_required
def eliminar_tarjeta(request, uuid):
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    
    # PROTECCIÓN: No borrar si ya tiene dinero movido
    if tarjeta.movimientos.exists():
        messages.error(request, "❌ No se puede eliminar: Esta tarjeta ya tiene historial financiero. Mejor bloquéala.")
    else:
        tarjeta.delete()
        messages.success(request, "Tarjeta eliminada del sistema.")
        
    return redirect('lista_tarjetas')