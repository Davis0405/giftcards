from decimal import Decimal
from rest_framework import serializers
from core.models import GiftCard, Transaccion
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'roles']

    def get_roles(self, obj):
        return list(obj.groups.values_list('name', flat=True))

class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        fields = ['id', 'saldo', 'fecha_vencimiento', 'activa', 'qr_image']
        read_only_fields = ['id', 'saldo', 'fecha_vencimiento', 'qr_image']

class GiftCardAdminSerializer(serializers.ModelSerializer):
    dueno_username = serializers.CharField(source='dueno.username', read_only=True, default='')
    movimientos_count = serializers.IntegerField(source='movimientos.count', read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            'id', 'saldo', 'fecha_creacion', 'fecha_vencimiento',
            'activa', 'vencida', 'pin', 'dueno', 'dueno_username',
            'email_cliente', 'qr_image', 'movimientos_count'
        ]

class CrearGiftCardSerializer(serializers.Serializer):
    saldo = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'), default=Decimal('0.00'))
    fecha_vencimiento = serializers.DateField(required=False, allow_null=True)
    pin = serializers.CharField(max_length=4, min_length=4, required=False)
    email_cliente = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    def validate_pin(self, value):
        if value and (len(value) != 4 or not value.isdigit()):
            raise serializers.ValidationError("El PIN debe tener 4 dígitos numéricos.")
        return value

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', '')
        )
        return user
    
class TransaccionSerializer(serializers.ModelSerializer):
    fecha = serializers.DateTimeField(format="%d/%m/%Y %H:%M")
    operador_nombre = serializers.CharField(source='operador.username', read_only=True, default='')
    
    class Meta:
        model = Transaccion
        fields = ['id', 'monto', 'tipo', 'fecha', 'operador_nombre']

class TransaccionAdminSerializer(serializers.ModelSerializer):
    fecha = serializers.DateTimeField(format="%d/%m/%Y %H:%M")
    operador_nombre = serializers.CharField(source='operador.username', read_only=True, default='Sistema')
    card_id = serializers.UUIDField(source='card.id', read_only=True)
    card_cliente = serializers.SerializerMethodField()

    class Meta:
        model = Transaccion
        fields = ['id', 'card_id', 'card_cliente', 'monto', 'tipo', 'fecha', 'operador_nombre']

    def get_card_cliente(self, obj):
        if obj.card.dueno:
            return obj.card.dueno.username
        return obj.card.email_cliente or 'Anónimo'

class CambioPinSerializer(serializers.Serializer):
    pin_actual = serializers.CharField(max_length=4, min_length=4)
    pin_nuevo = serializers.CharField(max_length=4, min_length=4)

    def validate_pin_nuevo(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("El PIN debe contener solo números.")
        return value

class CobroPOSSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    monto = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    pin = serializers.CharField(max_length=4, min_length=4)

class RecargaPOSSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    monto = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))