from django import forms
from .models import GiftCard

class GiftCardForm(forms.ModelForm):
    class Meta:
        model = GiftCard
        # IMPORTANTE: Aquí agregamos 'pin' a la lista para que aparezca
        fields = ['saldo', 'fecha_vencimiento', 'pin'] 
        
        widgets = {
            'saldo': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Saldo Inicial (Q)'
            }),
            'fecha_vencimiento': forms.DateInput(attrs={
                'class': 'form-control', 
                'type': 'date'
            }),
            # Agregamos el widget visual para el PIN
            'pin': forms.TextInput(attrs={
                'class': 'form-control text-center fw-bold', 
                'type': 'tel',      # Teclado numérico en móviles
                'maxlength': '4', 
                'placeholder': 'Ej: 1234'
            }),
        }
        labels = {
            'saldo': 'Saldo Inicial',
            'fecha_vencimiento': 'Vencimiento (Opcional)',
            'pin': 'PIN de Seguridad (4 Dígitos)',
        }