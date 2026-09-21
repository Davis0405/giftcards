import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import QRScannerModal from '../components/QRScannerModal';
import ModalPIN from '../components/ModalPIN';
import confetti from 'canvas-confetti';
import { 
  Store, 
  QrCode, 
  Search, 
  CreditCard, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Receipt, 
  Lock,
  Sparkles,
  Printer
} from 'lucide-react';

export default function TerminalPage() {
  const { user } = useAuth();
  const [cardUuid, setCardUuid] = useState('');
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Operación
  const [opMode, setOpMode] = useState('COBRO'); // 'COBRO' | 'RECARGA'
  const [amount, setAmount] = useState('');
  const [operating, setOperating] = useState(false);

  // Modales
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Resultado Financiero Explícito (Brief Sec. 18)
  const [txResult, setTxResult] = useState(null);

  const fetchCard = async (uuid) => {
    if (!uuid) return;
    try {
      setLoading(true);
      setError('');
      setTxResult(null);
      const res = await api.get(`/pos/tarjeta/${uuid.trim()}/`);
      setCardData(res.data);
      setAmount('');
    } catch (err) {
      console.error(err);
      setCardData(null);
      setError(err.response?.data?.error || 'No se encontró la tarjeta con el código proporcionado.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (cardUuid) fetchCard(cardUuid);
  };

  const handleScanSuccess = (scannedUuid) => {
    setCardUuid(scannedUuid);
    fetchCard(scannedUuid);
  };

  const handleQuickAmount = (val) => {
    if (val === 'ALL' && cardData) {
      setAmount(cardData.saldo);
    } else {
      setAmount(String(val));
    }
  };

  // Iniciar cobro (abre modal PIN)
  const handleStartCobro = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('El monto a cobrar debe ser mayor a Q0.00');
      return;
    }

    if (numAmount > Number(cardData.saldo)) {
      setError(`Saldo insuficiente. La tarjeta solo dispone de Q${cardData.saldo}`);
      return;
    }

    setIsPinModalOpen(true);
  };

  // Confirmar cobro con PIN
  const handleConfirmCobro = async (pin) => {
    try {
      setOperating(true);
      setError('');
      const prevSaldo = cardData.saldo;
      const res = await api.post('/pos/cobrar/', {
        uuid: cardData.id,
        monto: Number(amount),
        pin: pin
      });

      setIsPinModalOpen(false);
      const nuevoSaldo = res.data.nuevo_saldo;
      setCardData((prev) => ({ ...prev, saldo: nuevoSaldo }));

      // Pantalla de Confirmación Explícita Financiera (Brief Sec. 18)
      setTxResult({
        tipo: 'CONSUMO',
        monto: Number(amount),
        saldo_anterior: prevSaldo,
        saldo_restante: nuevoSaldo,
        mensaje: res.data.mensaje || 'Consumo procesado exitosamente.'
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar el cobro.');
      setIsPinModalOpen(false);
    } finally {
      setOperating(false);
    }
  };

  // Procesar recarga
  const handleRecarga = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('El monto a recargar debe ser mayor a Q0.00');
      return;
    }

    try {
      setOperating(true);
      const prevSaldo = cardData.saldo;
      const res = await api.post('/pos/recargar/', {
        uuid: cardData.id,
        monto: numAmount
      });

      const nuevoSaldo = res.data.nuevo_saldo;
      setCardData((prev) => ({ ...prev, saldo: nuevoSaldo }));

      // Pantalla de Confirmación Explícita Financiera
      setTxResult({
        tipo: 'RECARGA',
        monto: numAmount,
        saldo_anterior: prevSaldo,
        saldo_restante: nuevoSaldo,
        mensaje: res.data.mensaje || 'Recarga acreditada exitosamente.'
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar la recarga.');
    } finally {
      setOperating(false);
    }
  };

  const resetTerminal = () => {
    setCardUuid('');
    setCardData(null);
    setAmount('');
    setError('');
    setTxResult(null);
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val || 0);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* 1. Header Terminal POS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
            Terminal POS
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            Operaciones directas de cobro y recarga en mostrador
          </p>
        </div>

        {cardData && (
          <button onClick={resetTerminal} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} />
            <span>Nueva Búsqueda</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-danger-100)', 
          border: '1px solid rgba(198,40,40,0.2)', 
          color: 'var(--color-danger-600)', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Pantalla de Confirmación Financiera Explícita (Brief Sec. 18) */}
      {txResult ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: txResult.tipo === 'RECARGA' ? 'var(--color-success-100)' : 'var(--color-gold-soft)', 
            color: txResult.tipo === 'RECARGA' ? 'var(--color-success-600)' : 'var(--color-gold-600)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.25rem' 
          }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
            {txResult.tipo === 'RECARGA' ? '✓ Recarga Exitosa' : '✓ Consumo Realizado'}
          </h2>
          <div className="text-mono" style={{ fontSize: '2.25rem', fontWeight: '800', color: txResult.tipo === 'RECARGA' ? 'var(--color-success-600)' : 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
            {formatMoney(txResult.monto)}
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto 2rem', padding: '1.25rem', borderRadius: '14px', backgroundColor: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Saldo Anterior:</span>
              <span className="text-mono" style={{ fontWeight: '600' }}>{formatMoney(txResult.saldo_anterior)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)' }}>
              <span>Saldo Restante:</span>
              <span className="text-mono" style={{ color: 'var(--color-success-600)' }}>{formatMoney(txResult.saldo_restante)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={resetTerminal} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Nueva Operación
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} />
              Imprimir Comprobante
            </button>
          </div>
        </div>
      ) : !cardData ? (
        /* 3. Escáner / Búsqueda Inicial (Brief Sec. 17) */
        <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Escanee QR o ingrese código de tarjeta
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '2rem' }}>
              Utilice la cámara web para lectura instantánea o teclee el identificador de la Gift Card.
            </p>

            <button 
              onClick={() => setIsScannerOpen(true)} 
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-gold)' }}
            >
              <QrCode size={22} />
              <span>Abrir Cámara Escáner QR</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
              <span>O BÚSQUEDA MANUAL</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            </div>

            <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text"
                placeholder="Código o UUID (ej. 98fa7fb3...)"
                value={cardUuid}
                onChange={(e) => setCardUuid(e.target.value)}
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)' }}
                autoFocus
              />
              <button type="submit" disabled={loading} className="btn btn-secondary">
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 4. Tarjeta Encontrada & Panel Operativo (Brief Sec. 17) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card Resumen de la Tarjeta */}
          <div className="card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-soft) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span className="text-mono" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-espresso-950)' }}>
                    •••• {cardData.id?.slice(-6) || 'CARD'}
                  </span>
                  <span className={`badge ${cardData.activa ? 'badge-success' : 'badge-danger'}`}>
                    <span className="badge-dot"></span>
                    {cardData.activa ? 'ACTIVA' : 'BLOQUEADA'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Cliente: <strong style={{ color: 'var(--color-text-primary)' }}>{cardData.cliente || 'Al portador'}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', fontWeight: '700' }}>
                  Saldo Disponible
                </div>
                <div className="text-mono" style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-success-600)', lineHeight: '1.1' }}>
                  {formatMoney(cardData.saldo)}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Operación */}
          <div className="card" style={{ padding: '2rem' }}>
            {/* Selector de Modo */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <button 
                type="button"
                onClick={() => { setOpMode('COBRO'); setAmount(''); }}
                className={`btn ${opMode === 'COBRO' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.85rem' }}
              >
                <ArrowDownRight size={18} />
                <span>Cobrar / Consumo</span>
              </button>

              <button 
                type="button"
                onClick={() => { setOpMode('RECARGA'); setAmount(''); }}
                className={`btn ${opMode === 'RECARGA' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.85rem' }}
              >
                <ArrowUpRight size={18} />
                <span>Recargar Saldo</span>
              </button>
            </div>

            <form onSubmit={opMode === 'COBRO' ? handleStartCobro : handleRecarga}>
              {/* Botones de Monto Rápido */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Montos Rápidos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {[25, 50, 100, 200].map((val) => (
                    <button 
                      key={val} 
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: '700' }}
                    >
                      Q{val}
                    </button>
                  ))}
                  {opMode === 'COBRO' && (
                    <button 
                      type="button"
                      onClick={() => handleQuickAmount('ALL')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: '700', color: 'var(--color-gold-600)' }}
                    >
                      Todo
                    </button>
                  )}
                </div>
              </div>

              {/* Input Manual de Monto */}
              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label">Monto a {opMode === 'COBRO' ? 'Cobrar' : 'Recargar'} (GTQ)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    Q
                  </span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem', fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
              </div>

              {/* Botón de Ejecución */}
              <button 
                type="submit"
                disabled={operating || !cardData.activa}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', boxShadow: 'var(--shadow-gold)' }}
              >
                {opMode === 'COBRO' ? (
                  <>
                    <Lock size={18} />
                    <span>Continuar y Validar PIN</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={18} />
                    <span>Confirmar Recarga de {amount ? `Q${amount}` : 'Saldo'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modales */}
      {isScannerOpen && (
        <QRScannerModal 
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isPinModalOpen && (
        <ModalPIN 
          onSuccess={handleConfirmCobro}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}
    </div>
  );
}
