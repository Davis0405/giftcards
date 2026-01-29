from django import forms
from .models import GiftCard

class GiftCardForm(forms.ModelForm):
    class Meta:
        model = GiftCard
        fields = ['saldo', 'fecha_vencimiento']
        widgets = {
            'saldo': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Saldo Inicial (Q)'}),
            'fecha_vencimiento': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
        }
        labels = {
            'saldo': 'Saldo Inicial',
            'fecha_vencimiento': 'Vencimiento (Opcional)',
        }