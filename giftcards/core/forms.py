from django import forms
from .models import GiftCard

class GiftCardForm(forms.ModelForm):
    class Meta:
        model = GiftCard
        # 1. Agregamos 'email_cliente' a la lista de campos a guardar
        fields = ['saldo', 'fecha_vencimiento', 'pin', 'email_cliente'] 
        
        widgets = {
            'saldo': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Saldo Inicial (Q)'
            }),
            'fecha_vencimiento': forms.DateInput(attrs={
                'class': 'form-control', 
                'type': 'date'
            }),
            'pin': forms.TextInput(attrs={
                'class': 'form-control text-center fw-bold', 
                'type': 'tel',
                'maxlength': '4', 
                'placeholder': 'Ej: 1234'
            }),
            # 2. Widget para el correo
            'email_cliente': forms.EmailInput(attrs={
                'class': 'form-control', 
                'placeholder': 'cliente@ejemplo.com (Opcional)'
            }),
        }
        labels = {
            'saldo': 'Saldo Inicial',
            'fecha_vencimiento': 'Vencimiento (Opcional)',
            'pin': 'PIN de Seguridad (4 Dígitos)',
            'email_cliente': 'Correo Electrónico del Cliente',
        }