import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Lock, 
  Unlock, 
  QrCode, 
  Download, 
  KeyRound, 
  RefreshCw, 
  ArrowDownRight, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck,
  Wifi
} from 'lucide-react';
import nexocardLogo from '../assets/nexocard.png';

export default function PerfilClientePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinNuevo, setPinNuevo] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/auth/me/');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información de tu cuenta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const card = profile?.giftcard;

  const handleToggleBloqueo = async () => {
    if (!card) return;
    try {
      setActionLoading(true);
      setError(null);
      await api.post(`/admin/tarjetas/${card.id}/bloquear/`, {
        accion: card.estado === 'ACTIVA' ? 'bloquear' : 'desbloquear'
      });
      setSuccessMsg(card.estado === 'ACTIVA' ? 'Tarjeta bloqueada temporalmente por seguridad.' : 'Tarjeta desbloqueada con éxito.');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar el estado de la tarjeta.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActualizarPin = async (e) => {
    e.preventDefault();
    setPinError('');
    if (pinNuevo.length !== 4 || !/^\d{4}$/.test(pinNuevo)) {
      setPinError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    if (pinNuevo !== pinConfirm) {
      setPinError('Los PINs no coinciden.');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/admin/tarjetas/${card.id}/pin/`, { pin: pinNuevo });
      setSuccessMsg('Tu código PIN de seguridad ha sido actualizado con éxito.');
      setShowPinModal(false);
      setPinNuevo('');
      setPinConfirm('');
    } catch (err) {
      setPinError(err.response?.data?.error || 'Error al actualizar el PIN.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!card) return;
    try {
      setActionLoading(true);
      const response = await api.get(`/tarjetas/${card.id}/pdf/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NexoCard_${card.codigo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al descargar el comprobante en PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount || 0);
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--color-blue-600)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Mi Billetera Digital
          </h1>
          <span style={{ 
            backgroundColor: 'var(--color-blue-100)', 
            color: 'var(--color-blue-700)', 
            fontSize: '0.72rem', 
            fontWeight: 700, 
            padding: '0.2rem 0.55rem', 
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}>
            Cafetería Premium
          </span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', margin: 0 }}>
          Hola, {profile?.first_name || profile?.username}. Gestiona tu tarjeta NexoCard, revisa consumos y controla tu seguridad.
        </p>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div style={{ 
          backgroundColor: 'var(--color-success-100)', 
          border: '1px solid rgba(22,163,74,0.2)', 
          color: 'var(--color-success-600)', 
          padding: '1rem', 
          borderRadius: '14px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-danger-100)', 
          border: '1px solid rgba(220,38,38,0.2)', 
          color: 'var(--color-danger-600)', 
          padding: '1rem', 
          borderRadius: '14px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {!card ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CreditCard size={56} style={{ color: 'var(--color-blue-500)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            No tienes ninguna tarjeta NexoCard vinculada
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
            Solicita tu tarjeta física o digital en el mostrador para asociarla a tu correo ({profile?.email}).
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Tarjeta Digital Visual NexoCard */}
          <div>
            <div 
              style={{
                borderRadius: '20px',
                padding: '1.85rem',
                background: card.estado === 'BLOQUEADA'
                  ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
                  : 'linear-gradient(135deg, #020617 0%, #0F172A 45%, #1D4ED8 100%)',
                color: '#fff',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.45)',
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: '1.586',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              {/* Circuit glow watermark */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Top Row: NexoCard Logo & Contactless */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                <img 
                  src={nexocardLogo} 
                  alt="NexoCard" 
                  style={{ height: '24px', width: 'auto', filter: 'brightness(0) invert(1)' }} 
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi size={18} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                  {card.estado === 'BLOQUEADA' && (
                    <span style={{ 
                      backgroundColor: 'var(--color-danger-600)', 
                      color: '#fff', 
                      fontSize: '0.68rem', 
                      fontWeight: 800, 
                      padding: '0.15rem 0.55rem', 
                      borderRadius: '9999px',
                      textTransform: 'uppercase'
                    }}>
                      Bloqueada
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: EMV Chip & Balance */}
              <div style={{ zIndex: 1 }}>
                <div style={{ 
                  width: '40px', 
                  height: '30px', 
                  backgroundColor: '#E2E8F0', 
                  borderRadius: '6px', 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
                  boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.4)'
                }} />
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75 }}>
                  Saldo Disponible
                </div>
                <div className="text-mono" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  {formatMoney(card.saldo)}
                </div>
              </div>

              {/* Bottom Row: Code & Tenant info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                <div>
                  <div className="text-mono" style={{ fontSize: '1.1rem', letterSpacing: '0.15em', fontWeight: 700 }}>
                    {card.codigo || '•••• •••• ••••'}
                  </div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.7, marginTop: '2px' }}>
                    {card.titular_nombre || profile?.username} · Cafetería Premium
                  </div>
                </div>
                {card.fecha_expiracion && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>Vence</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {new Date(card.fecha_expiracion).toLocaleDateString('es-GT', { month: '2-digit', year: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button 
                onClick={() => setShowQrModal(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}
              >
                <QrCode size={18} style={{ color: 'var(--color-blue-600)' }} />
                <span>Mostrar QR</span>
              </button>

              <button 
                onClick={handleDownloadPdf}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}
              >
                <Download size={18} style={{ color: 'var(--color-blue-600)' }} />
                <span>PDF Tarjeta</span>
              </button>

              <button 
                onClick={() => setShowPinModal(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}
              >
                <KeyRound size={18} style={{ color: 'var(--color-blue-600)' }} />
                <span>Cambiar PIN</span>
              </button>
            </div>
          </div>

          {/* Estado de Seguridad & Controles */}
          <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={24} style={{ color: 'var(--color-success-600)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Seguridad de tu Tarjeta
                </h3>
              </div>

              <div style={{ 
                padding: '1rem', 
                borderRadius: '14px', 
                backgroundColor: card.estado === 'ACTIVA' ? 'var(--color-success-100)' : 'var(--color-danger-100)',
                border: `1px solid ${card.estado === 'ACTIVA' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: card.estado === 'ACTIVA' ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                      Estado: {card.estado}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                      {card.estado === 'ACTIVA' 
                        ? 'Lista para pagar en caja presentando el código o QR.' 
                        : 'Tu tarjeta está bloqueada temporalmente por seguridad.'}
                    </div>
                  </div>
                  <div>
                    {card.estado === 'ACTIVA' ? (
                      <Unlock size={22} style={{ color: 'var(--color-success-600)' }} />
                    ) : (
                      <Lock size={22} style={{ color: 'var(--color-danger-600)' }} />
                    )}
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.86rem', lineHeight: '1.5' }}>
                Si perdiste tu tarjeta física o detectas actividad sospechosa, puedes congelarla temporalmente de inmediato.
              </p>
            </div>

            <button 
              onClick={handleToggleBloqueo}
              disabled={actionLoading}
              className={`btn ${card.estado === 'ACTIVA' ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
            >
              {actionLoading ? (
                <RefreshCw size={18} className="spin-slow" />
              ) : card.estado === 'ACTIVA' ? (
                <>
                  <Lock size={18} />
                  <span>Congelar / Bloquear Tarjeta</span>
                </>
              ) : (
                <>
                  <Unlock size={18} />
                  <span>Descongelar Tarjeta</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Historial de Movimientos */}
      {card && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Movimientos Recientes
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Últimas transacciones registradas
            </span>
          </div>

          {!card.transacciones || card.transacciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-secondary)' }}>
              <Clock size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>No tienes transacciones registradas aún en esta tarjeta.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Operación</th>
                    <th>Monto</th>
                    <th>Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody>
                  {card.transacciones.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        {formatFecha(tx.fecha)}
                      </td>
                      <td>
                        <span className={`badge ${tx.tipo === 'RECARGA' ? 'badge-success' : 'badge-danger'}`}>
                          <span className="badge-dot"></span>
                          {tx.tipo}
                        </span>
                      </td>
                      <td className="text-mono" style={{ 
                        fontWeight: 700, 
                        color: tx.tipo === 'RECARGA' ? 'var(--color-success-600)' : 'var(--color-danger-600)' 
                      }}>
                        {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                      </td>
                      <td className="text-mono" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatMoney(tx.saldo_resultante)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal QR */}
      {showQrModal && card && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '2rem', textAlign: 'center', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
              Código QR de Pago
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Presenta este código al cajero de Cafetería Premium para pagar o recargar.
            </p>

            <div style={{ 
              display: 'inline-block', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              backgroundColor: '#fff', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid var(--color-border)',
              marginBottom: '1.25rem'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(card.codigo)}`} 
                alt="QR Tarjeta" 
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div className="text-mono" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
              {card.codigo}
            </div>

            <button 
              onClick={() => setShowQrModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Cambiar PIN */}
      {showPinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
              Cambiar Código PIN
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Ingresa un código de 4 dígitos para autorizar consumos.
            </p>

            {pinError && (
              <div style={{ 
                backgroundColor: 'var(--color-danger-100)', 
                border: '1px solid rgba(220,38,38,0.2)', 
                color: 'var(--color-danger-600)', 
                padding: '0.75rem', 
                borderRadius: '10px', 
                marginBottom: '1rem',
                fontSize: '0.82rem'
              }}>
                {pinError}
              </div>
            )}

            <form onSubmit={handleActualizarPin}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nuevo PIN (4 dígitos)</label>
                <input 
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={pinNuevo}
                  onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, ''))}
                  className="form-control text-mono"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirmar Nuevo PIN</label>
                <input 
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="form-control text-mono"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPinModal(false)}
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  {actionLoading ? 'Guardando...' : 'Guardar PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
