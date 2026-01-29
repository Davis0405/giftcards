from django.db import transaction
from django.core.exceptions import ValidationError
from .models import GiftCard, Transaccion

def procesar_consumo(uuid_tarjeta, monto, usuario_operador):
    """
    Maneja el débito de saldo de forma atómica.
    Bloquea la fila de la DB hasta que termine la transacción.
    """
    monto = float(monto) # Asegurar tipo numérico
    
    if monto <= 0:
        raise ValidationError("El monto debe ser mayor a 0")

    # INICIO BLOQUE TRANSACCIONAL
    with transaction.atomic():
        # select_for_update() bloquea la tarjeta para que nadie más la use en este milisegundo
        try:
            tarjeta = GiftCard.objects.select_for_update().get(id=uuid_tarjeta, activa=True)
        except GiftCard.DoesNotExist:
            raise ValidationError("Tarjeta no encontrada o inactiva")

        if tarjeta.saldo < monto:
            raise ValidationError(f"Saldo insuficiente. Disponible: Q{tarjeta.saldo}")

        # 1. Descontar saldo
        tarjeta.saldo -= monto
        tarjeta.save()

        # 2. Registrar historial (Auditoría)
        Transaccion.objects.create(
            card=tarjeta,
            monto=monto,
            tipo='CONSUMO',
            operador=usuario_operador
        )
        
        return tarjeta.saldo
    # FIN BLOQUE TRANSACCIONAL