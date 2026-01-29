from django.contrib import admin
from .models import GiftCard, Transaccion

@admin.register(GiftCard)
class GiftCardAdmin(admin.ModelAdmin):
    list_display = ('id', 'saldo', 'activa', 'fecha_creacion')
    readonly_fields = ('id', 'qr_image', 'fecha_creacion')

@admin.register(Transaccion)
class TransaccionAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'tipo', 'monto', 'card', 'operador')
    list_filter = ('tipo', 'fecha')