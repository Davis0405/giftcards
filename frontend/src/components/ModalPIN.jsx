import React, { useState } from 'react';
import { Lock, Delete, X, ShieldAlert } from 'lucide-react';

export default function ModalPIN({ isOpen, onClose, onConfirm, monto, loading }) {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>PIN de Seguridad</span>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: '1.5rem 1.75rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Monto a debitar:
          </p>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.25rem' }}>
            Q{Number(monto || 0).toFixed(2)}
          </div>

          {/* Indicadores de 4 dígitos */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid var(--border)',
                  background: idx < pin.length ? 'var(--accent-gold)' : 'transparent',
                  boxShadow: idx < pin.length ? '0 0 10px rgba(212, 175, 55, 0.5)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            ))}
          </div>

          {/* Teclado numérico táctil */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={loading}
                onClick={() => handleDigit(String(num))}
                className="btn btn-outline"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  height: '56px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)'
                }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => setPin('')}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', fontWeight: 600, height: '56px' }}
            >
              Limpiar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDigit('0')}
              className="btn btn-outline"
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)'
              }}
            >
              0
            </button>
            <button
              type="button"
              disabled={loading || pin.length === 0}
              onClick={handleDelete}
              className="btn btn-outline"
              style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Delete size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-gold"
              style={{ flex: 1.5 }}
              onClick={handleConfirm}
              disabled={loading || pin.length !== 4}
            >
              {loading ? 'Validando...' : 'Autorizar Cobro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
