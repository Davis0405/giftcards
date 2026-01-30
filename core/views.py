from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import GiftCard, Transaccion
from django.db import transaction
from .forms import GiftCardForm
from decimal import Decimal #para manejar dinero
import random
from django.utils import timezone
from django.db.models import Sum 
from django.http import HttpResponse
from django.template.loader import get_template
from io import BytesIO
import os
from django.conf import settings
from django.core.mail import EmailMessage
from .utils import render_to_pdf
import pdfkit
from django.template.loader import render_to_string

# En core/views.py
from django.db.models import Sum

@login_required
def dashboard_general(request):
    # Datos para los indicadores del Dashboard
    hoy = timezone.now().date()
    
    context = {
        # Si es staff ve el total, si no, ve 0 (o lo que tú definas)
        'total_tarjetas': GiftCard.objects.filter(activa=True).count() if request.user.is_staff else 0,
        
        # Ventas del usuario hoy
        'ventas_hoy': Transaccion.objects.filter(
            operador=request.user, 
            fecha__date=hoy, 
            tipo='CONSUMO'
        ).aggregate(Sum('monto'))['monto__sum'] or 0,
        
        # Última vez que usó el sistema
        'ultima_transaccion': Transaccion.objects.filter(
            operador=request.user
        ).order_by('-fecha').first().fecha if Transaccion.objects.filter(operador=request.user).exists() else None
    }
    
    return render(request, 'core/dashboard.html', context)

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
    
    if not tarjeta.activa:
        messages.error(request, "❌ Esta tarjeta está BLOQUEADA y no puede usarse.")
        return redirect('terminal')

    # B) ¿Está vencida? (Aquí fue el error)
    # Usamos timezone.now().date() para comparar solo la fecha (sin hora)
    if tarjeta.fecha_vencimiento and tarjeta.fecha_vencimiento < timezone.now().date():
        messages.error(request, "❌ Esta tarjeta ha VENCIDO.")
        return redirect('terminal')

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
    # SEGURIDAD: Solo gerentes
    if not request.user.is_staff:
        messages.error(request, "⛔ No tienes permisos para emitir tarjetas.")
        return redirect('dashboard')

    if request.method == 'POST':
        form = GiftCardForm(request.POST)
        if form.is_valid():
            nueva_tarjeta = form.save()
            if nueva_tarjeta.saldo > 0:
                Transaccion.objects.create(
                    card=nueva_tarjeta,
                    monto=nueva_tarjeta.saldo,
                    tipo='ACTIVACION',  # Tipo especial para diferenciar de recargas
                    operador=request.user
                )
            if nueva_tarjeta.email_cliente:
                try:
                    pdf_content = render_to_pdf('core/pdf_tarjeta.html', {
                        'tarjeta': nueva_tarjeta,
                        'request': request
                    })
                    
                    if pdf_content:
                        asunto = f"¡Tu Gift Card de Q{nueva_tarjeta.saldo} ha llegado! 🎁"
                        mensaje = f"""... (Tu mensaje de bienvenida) ..."""
                        
                        email = EmailMessage(
                            asunto,
                            mensaje,
                            settings.DEFAULT_FROM_EMAIL,
                            [nueva_tarjeta.email_cliente], # Usamos el campo del modelo
                        )
                        email.attach(f'GiftCard_{nueva_tarjeta.id}.pdf', pdf_content, 'application/pdf')
                        email.send()
                        messages.success(request, f"✅ Tarjeta creada y enviada a {nueva_tarjeta.email_cliente}")
                    
                except Exception as e:
                    messages.warning(request, f"Tarjeta guardada, pero falló el envío: {e}")
            else:
                messages.success(request, "Tarjeta creada exitosamente (Sin correo).")
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
    # SEGURIDAD: Solo gerentes
    if not request.user.is_staff:
        messages.error(request, "⛔ Acceso denegado: Solo Gerencia.")
        return redirect('dashboard')
    # Obtenemos las últimas 50 transacciones (orden inverso por fecha)
    movimientos = Transaccion.objects.select_related('card', 'operador').all().order_by('-fecha')[:50]
    
    return render(request, 'core/transacciones.html', {'movimientos': movimientos})

# core/views.py

@login_required
def lista_tarjetas(request):
    # SEGURIDAD: Solo gerentes
    if not request.user.is_staff:
        messages.error(request, "⛔ Acceso denegado: Solo Gerencia.")
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

@login_required
def corte_caja(request):
    hoy = timezone.now().date()
    
    # 1. Filtramos: Usuario actual + Fecha de hoy + Solo Entradas de dinero (Cargas y Activaciones)
    ingresos = Transaccion.objects.filter(
        operador=request.user,
        fecha__date=hoy,
        tipo__in=['CARGA', 'ACTIVACION'] 
    ).order_by('-fecha')
    
    # 2. Sumamos el total
    total_dia = ingresos.aggregate(Sum('monto'))['monto__sum'] or 0
    
    # 3. Contamos cuántas operaciones fueron
    cantidad_ops = ingresos.count()
    
    context = {
        'movimientos': ingresos,
        'total_dia': total_dia,
        'cantidad_ops': cantidad_ops,
        'fecha': hoy
    }
    return render(request, 'core/corte_caja.html', context)

import pdfkit # <--- Import nuevo
from django.template.loader import render_to_string

@login_required
def generar_pdf(request, uuid):
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    
    # 1. Configuración de wkhtmltopdf (Apunta a donde lo instalaste)
    # Si lo instalaste en otra carpeta, cambia esta ruta:
    path_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
    config = pdfkit.configuration(wkhtmltopdf=path_wkhtmltopdf)
    
    # 2. Opciones de impresión (Márgenes, tamaño)
    options = {
        'page-size': 'A5', # O puedes usar 'Letter'
        'margin-top': '0.0in',
        'margin-right': '0.0in',
        'margin-bottom': '0.0in',
        'margin-left': '0.0in',
        'encoding': "UTF-8",
        'no-outline': None,
        'enable-local-file-access': None # Permite cargar imágenes locales
    }
    
    # 3. Renderizar HTML
    html_string = render_to_string('core/pdf_tarjeta.html', {
        'tarjeta': tarjeta,
        'request': request
    })
    
    # 4. Generar PDF
    pdf = pdfkit.from_string(html_string, False, configuration=config, options=options)
    
    # 5. Respuesta
    response = HttpResponse(pdf, content_type='application/pdf')
    filename = f"GiftCard_{tarjeta.id}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response