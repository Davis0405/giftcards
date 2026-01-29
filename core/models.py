import uuid
import qrcode
from io import BytesIO
from django.db import models
from django.core.files import File
from django.contrib.auth.models import User

class GiftCard(models.Model):
    # UUID: Identificador único universal (el que irá en el QR)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Saldo: Decimal para precisión financiera
    saldo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    activa = models.BooleanField(default=True)
    pin = models.CharField(max_length=4, default='0000', help_text="Clave de 4 dígitos")
    
    # Guardaremos la imagen del QR generada automáticamente
    qr_image = models.ImageField(upload_to='qrs/', blank=True, null=True)

    def save(self, *args, **kwargs):
        # Generar QR automáticamente al crear la tarjeta por primera vez
        if not self.qr_image:
            qrcode_img = qrcode.make(str(self.id))
            canvas = BytesIO()
            qrcode_img.save(canvas, format='PNG')
            file_name = f'qr_{self.id}.png'
            self.qr_image.save(file_name, File(canvas), save=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Card {str(self.id)[:8]}... | Saldo: Q{self.saldo}"

class Transaccion(models.Model):
    TIPOS = (
        ('CARGA', 'Carga de Saldo'),
        ('CONSUMO', 'Consumo en Tienda'),
    )
    
    card = models.ForeignKey(GiftCard, on_delete=models.PROTECT, related_name='movimientos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPOS)
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Opcional: Quién hizo la transacción (Cajero o Admin)
    operador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.tipo} - Q{self.monto} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"