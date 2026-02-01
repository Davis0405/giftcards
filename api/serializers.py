from rest_framework import serializers
from core.models import GiftCard

class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        # Elegimos qué campos verá la App Móvil
        fields = ['id', 'saldo', 'fecha_vencimiento', 'activa', 'qr_image']
        read_only_fields = ['id', 'saldo', 'fecha_vencimiento', 'qr_image'] 
        # Nota: 'activa' NO es read-only porque queremos poder cambiarlo (Bloquear/Desbloquear)