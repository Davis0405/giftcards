from rest_framework import serializers
from core.models import GiftCard, Transaccion
from django.contrib.auth.models import User

class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        # Elegimos qué campos verá la App Móvil
        fields = ['id', 'saldo', 'fecha_vencimiento', 'activa', 'qr_image']
        read_only_fields = ['id', 'saldo', 'fecha_vencimiento', 'qr_image'] 
        # Nota: 'activa' NO es read-only porque queremos poder cambiarlo (Bloquear/Desbloquear)

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    # Campo extra para confirmar contraseña (opcional pero recomendado)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name']

    def create(self, validated_data):
        # Creamos el usuario usando el método seguro de Django (que encripta la password)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', '')
        )
        return user
    
class TransaccionSerializer(serializers.ModelSerializer):
    # Formateamos la fecha para que se lea bonito (Ej: "31/01/2026 15:30")
    fecha = serializers.DateTimeField(format="%d/%m/%Y %H:%M")
    
    class Meta:
        model = Transaccion
        fields = ['id', 'monto', 'tipo', 'fecha']

class CambioPinSerializer(serializers.Serializer):
    pin_actual = serializers.CharField(max_length=4, min_length=4)
    pin_nuevo = serializers.CharField(max_length=4, min_length=4)

    def validate_pin_nuevo(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("El PIN debe contener solo números.")
        return value