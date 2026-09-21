from functools import wraps
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import GiftCard, Transaccion, CierreDiario
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
from django.template.loader import render_to_string
from django.db.models import Sum
from datetime import time, timedelta
from django.contrib.auth.models import User
import threading
from django.core.paginator import Paginator
import dotenv
from django.utils.crypto import constant_time_compare
from django.core.cache import cache
import logging
from pathlib import Path
logger = logging.getLogger(__name__)
from io import BytesIO
from xhtml2pdf import pisa
from django.template.loader import render_to_string
from django.http import HttpResponse
import base64
import os

dotenv.load_dotenv()

def validar_tarjeta_activa(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        uuid_tarjeta = request.GET.get('uuid') or request.POST.get('uuid')
        if not uuid_tarjeta:
            messages.warning(request, "Debes escanear un código primero.")
            return redirect('dashboard')
        
        tarjeta = get_object_or_404(GiftCard, id=uuid_tarjeta)
        
        if not tarjeta.activa:
            messages.error(request, "❌ Esta tarjeta está BLOQUEADA.")
            return redirect('terminal')
        
        if tarjeta.fecha_vencimiento and tarjeta.fecha_vencimiento < timezone.now().date():
            messages.error(request, "❌ Esta tarjeta ha VENCIDO.")
            return redirect('terminal')
        
        # Inyectamos la tarjeta validada en kwargs
        kwargs['tarjeta_validada'] = tarjeta
        return view_func(request, *args, **kwargs)
    
    return wrapper

@login_required
def home_redirect(request):
    """
    Esta función decide a dónde va el usuario según su grupo.
    Úsala como tu URL raíz ('/') o LOGIN_REDIRECT_URL.
    """
    # Obtenemos los nombres de los grupos del usuario
    grupos = request.user.groups.values_list('name', flat=True)

    # 1. GERENTES y ADMINS -> Dashboard Completo
    if 'Gerencia' in grupos or request.user.is_superuser:
        return redirect('dashboard') 
        
    # 2. CAJEROS -> Terminal de Cobro (o Dashboard limitado)
    elif 'Cajeros' in grupos:
        return redirect('terminal') 
        
    # 3. CLIENTES -> Su Perfil Personal
    elif 'Clientes' in grupos:
        return redirect('perfil_cliente')
        
    # 4. Huerfanos (Sin grupo) -> Perfil por defecto
    else:
        return redirect('perfil_cliente')
    
@login_required
def perfil_cliente(request):
    # SEGURIDAD: Si un empleado cae aquí por error, lo mandamos a trabajar
    grupos = request.user.groups.values_list('name', flat=True)
    if 'Gerencia' in grupos or 'Cajeros' in grupos:
        return redirect('dashboard')

    # FILTRO CLAVE: Solo mostramos las tarjetas donde dueno == usuario actual
    mis_tarjetas = GiftCard.objects.filter(
        dueno=request.user, 
        activa=True
    ).prefetch_related('movimientos')
    
    return render(request, 'core/perfil_cliente.html', {'tarjetas': mis_tarjetas})

@login_required
def dashboard_general(request):
    cache_key = f'dashboard_stats_{request.user.id}'
    context = cache.get(cache_key)
    
    if not context:
        hoy = timezone.now().date()
        context = {
            'total_tarjetas': GiftCard.objects.filter(activa=True).count(),
            'ventas_hoy': Transaccion.objects.filter(
                operador=request.user, 
                fecha__date=hoy, 
                tipo='CONSUMO'
            ).aggregate(Sum('monto'))['monto__sum'] or 0,
            # ...
        }
        cache.set(cache_key, context, 300)  # 5 minutos
    
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

@validar_tarjeta_activa
@login_required
def procesar_cobro(request, tarjeta_validada=None):
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
            if not constant_time_compare(pin_ingresado, tarjeta.pin):
                messages.error(request, "❌ PIN INCORRECTO.")
                # Agregar delay para prevenir fuerza bruta
                time.sleep(1)
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
@validar_tarjeta_activa
def recargar_saldo(request, tarjeta_validada=None):
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
                messages.success(request, f"✅ Recarga de Q{monto} exitosa. Nuevo saldo: Q{tarjeta.saldo}")
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
            nueva_tarjeta = form.save(commit=False)

            # 1. 🕵️‍♂️ DETECTIVE DE USUARIOS (Auto-asociar si existe email)
            if nueva_tarjeta.email_cliente:
                usuario_existente = User.objects.filter(email=nueva_tarjeta.email_cliente).first()
                if usuario_existente:
                    nueva_tarjeta.dueno = usuario_existente
                    messages.info(request, f"🔗 Tarjeta vinculada a: {usuario_existente.username}")

            # 2. Calcular Vencimiento (1 año)
            if not nueva_tarjeta.fecha_vencimiento:
                nueva_tarjeta.fecha_vencimiento = timezone.now().date() + timedelta(days=365)
            
            # 3. Guardar tarjeta
            nueva_tarjeta.save()

            # 4. Registrar activación (si tiene saldo)
            if nueva_tarjeta.saldo > 0:
                Transaccion.objects.create(
                    card=nueva_tarjeta,
                    monto=nueva_tarjeta.saldo,
                    tipo='ACTIVACION',
                    operador=request.user
                )
            
            # 5. 🚀 ENVÍO DE CORREO EN SEGUNDO PLANO (THREADING COMPLETO)
            if nueva_tarjeta.email_cliente:
                try:
                    # ✅ CAMBIO CLAVE: Solo pasamos los datos, NO generamos el PDF aquí
                    EmailWithPDFThread(nueva_tarjeta, request).start()
                    messages.success(request, f"✅ Tarjeta creada. El correo se está enviando en segundo plano.")
                except Exception as e:
                    print(f"Error iniciando thread de email: {e}")
                    messages.warning(request, "Tarjeta creada, pero hubo un problema al enviar el correo.")
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
    movimientos = Transaccion.objects.select_related(
        'card', 
        'card__dueno',  # Pre-carga el dueño
        'operador'
    ).all().order_by('-fecha')[:50]
    
    return render(request, 'core/transacciones.html', {'movimientos': movimientos})

# core/views.py

@login_required
def lista_tarjetas(request):
    # SEGURIDAD: Solo gerentes
    if not request.user.is_staff:
        messages.error(request, "⛔ Acceso denegado.")
        return redirect('dashboard')

    # 🔍 BÚSQUEDA Y FILTROS
    search_query = request.GET.get('search', '').strip()
    status_filter = request.GET.get('status', '')
    
    # Consulta base
    lista = GiftCard.objects.select_related('dueno').all()
    
    # Aplicar búsqueda (si existe)
    if search_query:
        from django.db.models import Q
        lista = lista.filter(
            Q(id__icontains=search_query) |  # Por ID
            Q(dueno__username__icontains=search_query) |  # Por nombre de dueño
            Q(dueno__email__icontains=search_query) |  # Por email
            Q(saldo__icontains=search_query)  # Por saldo
        )
    
    # Aplicar filtro de estado
    if status_filter == 'active':
        lista = lista.filter(activa=True, saldo__gt=0)
    elif status_filter == 'blocked':
        lista = lista.filter(activa=False)
    elif status_filter == 'depleted':
        lista = lista.filter(activa=True, saldo=0)
    
    # Ordenar
    lista = lista.order_by('-fecha_creacion')
    
    # 📄 PAGINACIÓN: 30 tarjetas por página
    paginator = Paginator(lista, 30)
    page_num = request.GET.get('page')
    tarjetas = paginator.get_page(page_num)
    
    # Calcular estadísticas (de TODAS las tarjetas, no solo la página actual)
    todas_las_tarjetas = GiftCard.objects.all()
    stats = {
        'total': todas_las_tarjetas.count(),
        'activas': todas_las_tarjetas.filter(activa=True, saldo__gt=0).count(),
        'bloqueadas': todas_las_tarjetas.filter(activa=False).count(),
        'saldo_total': todas_las_tarjetas.aggregate(Sum('saldo'))['saldo__sum'] or 0,
    }
    
    context = {
        'tarjetas': tarjetas,
        'stats': stats,
        'search_query': search_query,
        'status_filter': status_filter,
    }
    
    return render(request, 'core/lista_tarjetas.html', context)

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
    
    # 1. 🔒 VERIFICAR CANDADO: ¿Ya cerró caja hoy este usuario?
    cierre_existente = CierreDiario.objects.filter(operador=request.user, fecha=hoy).first()

    # 2. OBTENER DATOS (Tu filtro actual)
    # Nota: Aquí estás incluyendo 'CONSUMO'. Recuerda que esto mezcla dinero real con saldo virtual.
    ingresos = Transaccion.objects.select_related('card').filter(
        operador=request.user,
        fecha__date=hoy,
        tipo__in=['CARGA', 'ACTIVACION', 'CONSUMO'] 
    ).order_by('-fecha')
    
    total_dia = ingresos.aggregate(Sum('monto'))['monto__sum'] or 0
    cantidad_ops = ingresos.count()
    
    # 3. PREPARAR CONTEXTO
    context = {
        'movimientos': ingresos, 
        'total_dia': total_dia,
        'cantidad_ops': cantidad_ops,
        'fecha': hoy,
        'cajero': request.user,
        'cierre_realizado': cierre_existente # <--- Variable útil para ocultar el botón en el HTML
    }

    # 4. AVISO VISUAL SI YA CERRÓ
    if cierre_existente:
        messages.warning(request, "⚠️ ATENCIÓN: Tu caja ya fue cerrada el día de hoy. No se pueden realizar cambios.")

    # ========================================================
    # 🖨️ ACCIÓN: CERRAR CAJA Y GENERAR PDF
    # ========================================================
    if request.GET.get('accion') == 'pdf':
        
        # A) 🛑 BLOQUEO DE SEGURIDAD
        if cierre_existente:
            messages.error(request, "⛔ ERROR CRÍTICO: La caja ya está cerrada. No puedes volver a cerrarla.")
            return redirect('dashboard')
            
        try:
            # B) 🔒 GUARDAMOS EL CANDADO EN LA BD (El paso irreversible)
            CierreDiario.objects.create(
                operador=request.user,
                fecha=hoy,
                total_recaudado=total_dia,
                cantidad_operaciones=cantidad_ops
            )

            # C) GENERAMOS EL PDF
            pdf = render_to_pdf('core/pdf_corte.html', context)
            
            if pdf:
                # D) ENVIAMOS CORREO AL JEFE (Usando EmailThread GENÉRICO)
                asunto = f"📊 Cierre de Caja - {request.user.username} - {hoy}"
                email = EmailMessage(
                    asunto,
                    f"Se adjunta el corte de caja del día. \n\nTotal Operado: Q{total_dia}\nTransacciones: {cantidad_ops}",
                    settings.DEFAULT_FROM_EMAIL,
                    [os.getenv('EMAIL_ADMIN')], 
                )
                email.attach(f'Corte_{hoy}.pdf', pdf, 'application/pdf')
                
                # Usamos la clase simple que agregamos antes
                EmailThread(email).start() 

                # E) DESCARGAMOS EL PDF AL CAJERO
                response = HttpResponse(pdf, content_type='application/pdf')
                filename = f"Corte_Caja_{hoy}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                messages.success(request, "✅ Caja cerrada correctamente. El reporte ha sido enviado.")
                return response
                
        except Exception as e:
            # Si falla, intentamos borrar el cierre para que pueda intentar de nuevo (opcional)
            # CierreDiario.objects.filter(operador=request.user, fecha=hoy).delete()
            messages.error(request, f"Error al cerrar la caja: {e}")
            return redirect('corte_caja') # Recargamos la página para limpiar la URL

    # ========================================================

    return render(request, 'core/corte_caja.html', context)

@login_required
def generar_pdf(request, uuid):
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    
    # Convertir QR a BASE64
    qr_base64 = None
    try:
        qr_path = os.path.join(settings.MEDIA_ROOT, tarjeta.qr_image.name)
        with open(qr_path, 'rb') as img_file:
            img_data = img_file.read()
            qr_base64 = f"data:image/png;base64,{base64.b64encode(img_data).decode('utf-8')}"
    except Exception as e:
        print(f"Error cargando QR: {e}")
    
    # Renderizar HTML
    html_string = render_to_string('core/pdf_tarjeta.html', {
        'tarjeta': tarjeta,
        'qr_base64': qr_base64,
        'base_url': f"{request.scheme}://{request.get_host()}"
    })
    
    # Generar PDF
    result = BytesIO()
    pdf_status = pisa.pisaDocument(
        BytesIO(html_string.encode("UTF-8")), 
        result
    )
    
    if pdf_status.err:
        messages.error(request, "Error generando PDF")
        return redirect('dashboard')
    
    # Respuesta
    response = HttpResponse(result.getvalue(), content_type='application/pdf')
    filename = f"GiftCard_{tarjeta.id}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response

# ========================================================================
# 📧 CLASE MEJORADA PARA ENVÍO DE EMAIL CON PDF EN BACKGROUND
# ========================================================================


class EmailWithPDFThread(threading.Thread):
    """
    Thread que genera el PDF y envía el email en segundo plano
    """
    def __init__(self, tarjeta, request):
        self.tarjeta = tarjeta
        self.scheme = request.scheme
        self.host = request.get_host()
        threading.Thread.__init__(self)
        self.daemon = True

    def run(self):
        try:
            # Convertir QR a base64
            qr_base64 = self._get_qr_base64()
            
            # Generar PDF
            from .utils import render_to_pdf
            pdf_content = render_to_pdf('core/pdf_tarjeta.html', {
                'tarjeta': self.tarjeta,
                'base_url': f"{self.scheme}://{self.host}",
                'qr_base64': qr_base64
            })
            
            if pdf_content:
                asunto = f"¡Tu Gift Card de Q{self.tarjeta.saldo} ha llegado! 🎁"
                mensaje = f"""Hola,

¡Felicidades! Tienes una nueva Gift Card.

📊 Detalles:
   • Saldo inicial: Q{self.tarjeta.saldo}
   • PIN de seguridad: {self.tarjeta.pin}
   • Válida hasta: {self.tarjeta.fecha_vencimiento.strftime('%d/%m/%Y')}

Adjunto encontrarás tu código QR para usar la tarjeta.

¡Disfruta tu compra! 🎉
"""
                
                email = EmailMessage(
                    asunto,
                    mensaje,
                    settings.DEFAULT_FROM_EMAIL,
                    [self.tarjeta.email_cliente],
                )
                email.attach(
                    f'GiftCard_{self.tarjeta.id}.pdf', 
                    pdf_content, 
                    'application/pdf'
                )
                
                email.send()
                print(f"✅ Email enviado exitosamente a {self.tarjeta.email_cliente}")
            else:
                print(f"❌ Error: No se pudo generar el PDF")
                
        except Exception as e:
            print(f"❌ Error enviando email: {e}")
            import traceback
            traceback.print_exc()
    
    def _get_qr_base64(self):
        """Convierte el QR a Base64"""
        try:
            import base64
            from pathlib import Path
            
            qr_path = Path(settings.MEDIA_ROOT) / self.tarjeta.qr_image.name
            
            with open(qr_path, 'rb') as img_file:
                img_data = img_file.read()
                base64_data = base64.b64encode(img_data).decode('utf-8')
                
            return f"data:image/png;base64,{base64_data}"
            
        except Exception as e:
            print(f"Error convirtiendo QR: {e}")
            return None

@login_required
def bloquear_tarjeta(request, uuid):
    tarjeta = get_object_or_404(GiftCard, id=uuid)
    estado_anterior = tarjeta.activa
    tarjeta.activa = not tarjeta.activa
    tarjeta.save()
    
    # 📝 Auditoría
    logger.warning(
        f"Tarjeta {uuid} {'BLOQUEADA' if not tarjeta.activa else 'DESBLOQUEADA'} "
        f"por {request.user.username} | Saldo: Q{tarjeta.saldo}"
    )

class EmailThread(threading.Thread):
    """
    Thread genérico para enviar cualquier objeto EmailMessage en segundo plano.
    Ideal para cuando ya tienes el PDF generado y adjunto.
    """
    def __init__(self, email):
        self.email = email
        threading.Thread.__init__(self)

    def run(self):
        try:
            self.email.send()
            print("✅ Email genérico enviado correctamente.")
        except Exception as e:
            print(f"❌ Error enviando email genérico: {e}")