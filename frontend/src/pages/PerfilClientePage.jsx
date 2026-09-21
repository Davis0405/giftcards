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
  Coffee, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck,
  Wifi
} from 'lucide-react';

export default function PerfilClientePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // PIN change state
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
      const nuevoEstado = card.estado === 'ACTIVA' ? 'BLOQUEADA' : 'ACTIVA';
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
      link.setAttribute('download', `GiftCard_${card.codigo}.pdf`);
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
        <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--amber-gold)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--espresso-dark)', margin: '0 0 0.5rem 0' }}>
          ¡Hola, {profile?.first_name || profile?.username}! ☕
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Administra tu tarjeta de regalo digital de Cafetería Premium, revisa tus consumos y controla tu seguridad.
        </p>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div style={{ 
          backgroundColor: '#ECFDF5', 
          border: '1px solid #A7F3D0', 
          color: '#065F46', 
          padding: '1rem', 
          borderRadius: '0.75rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: '#FEF2F2', 
          border: '1px solid #FECACA', 
          color: '#991B1B', 
          padding: '1rem', 
          borderRadius: '0.75rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {!card ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Coffee size={56} style={{ color: 'var(--amber-gold)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--espresso-dark)', marginBottom: '0.5rem' }}>
            No tienes ninguna Gift Card vinculada
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            Solicita tu tarjeta física o digital en el mostrador de nuestra cafetería para vincularla a tu correo ({profile?.email}).
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Tarjeta Digital Visual */}
          <div>
            <div 
              className="card-preview"
              style={{
                borderRadius: '1.25rem',
                padding: '2rem',
                background: card.estado === 'BLOQUEADA'
                  ? 'linear-gradient(135deg, #4B5563 0%, #1F2937 100%)'
                  : 'linear-gradient(135deg, #2B1810 0%, #4A2810 50%, #74512D 100%)',
                color: '#fff',
                boxShadow: '0 20px 35px -10px rgba(43, 24, 16, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: '1.586',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}
            >
              {/* Card Gold Trim Watermark */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0) 70%)',
                pointerEvents: 'none'
              }} />

              {/* Top Row: Brand & Contactless */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Coffee size={24} style={{ color: 'var(--amber-gold)' }} />
                  <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: '700', fontSize: '1.15rem', letterSpacing: '0.05em' }}>
                    CAFETERÍA PREMIUM
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi size={20} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                  {card.estado === 'BLOQUEADA' && (
                    <span style={{ 
                      backgroundColor: '#EF4444', 
                      color: '#fff', 
                      fontSize: '0.7rem', 
                      fontWeight: '800', 
                      padding: '0.2rem 0.6rem', 
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
                  width: '42px', 
                  height: '32px', 
                  backgroundColor: '#D4AF37', 
                  borderRadius: '6px', 
                  marginBottom: '1.25rem',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D4AF37 50%, #B45309 100%)',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                  border: '1px solid #78350F'
                }} />
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>
                  Saldo Disponible
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#FEF3C7' }}>
                  {formatMoney(card.saldo)}
                </div>
              </div>

              {/* Bottom Row: Code & Holder */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.18em', opacity: 0.95 }}>
                    {card.codigo || '•••• •••• ••••'}
                  </div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, marginTop: '0.25rem' }}>
                    {card.titular_nombre || profile?.username}
                  </div>
                </div>
                {card.fecha_expiracion && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>Vence</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                      {new Date(card.fecha_expiracion).toLocaleDateString('es-GT', { month: '2-digit', year: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Rápidas Tarjeta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button 
                onClick={() => setShowQrModal(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}
              >
                <QrCode size={20} style={{ color: 'var(--amber-gold)' }} />
                <span>Mostrar QR</span>
              </button>

              <button 
                onClick={handleDownloadPdf}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}
              >
                <Download size={20} style={{ color: 'var(--amber-gold)' }} />
                <span>PDF Tarjeta</span>
              </button>

              <button 
                onClick={() => setShowPinModal(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}
              >
                <KeyRound size={20} style={{ color: 'var(--amber-gold)' }} />
                <span>Cambiar PIN</span>
              </button>
            </div>
          </div>

          {/* Estado de Seguridad & Controles */}
          <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={24} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--espresso-dark)', margin: 0 }}>
                  Seguridad y Ajustes
                </h3>
              </div>

              <div style={{ 
                padding: '1rem', 
                borderRadius: '0.75rem', 
                backgroundColor: card.estado === 'ACTIVA' ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${card.estado === 'ACTIVA' ? '#A7F3D0' : '#FECACA'}`,
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: card.estado === 'ACTIVA' ? '#065F46' : '#991B1B' }}>
                      Estado: {card.estado}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: card.estado === 'ACTIVA' ? '#047857' : '#B91C1C', marginTop: '0.2rem' }}>
                      {card.estado === 'ACTIVA' 
                        ? 'Tu tarjeta está lista para pagar en caja presentando el código o QR.' 
                        : 'Tu tarjeta está bloqueada. No se podrán realizar consumos hasta que la desbloquees.'}
                    </div>
                  </div>
                  <div>
                    {card.estado === 'ACTIVA' ? (
                      <Unlock size={24} style={{ color: '#059669' }} />
                    ) : (
                      <Lock size={24} style={{ color: '#DC2626' }} />
                    )}
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
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
                  Congelar / Bloquear Tarjeta
                </>
              ) : (
                <>
                  <Unlock size={18} />
                  Descongelar Tarjeta
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Historial de Movimientos de la Tarjeta */}
      {card && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--espresso-dark)', margin: 0 }}>
              Movimientos Recientes
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Mostrando últimas transacciones
            </span>
          </div>

          {!card.transacciones || card.transacciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>No tienes transacciones registradas aún en esta tarjeta.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
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
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatFecha(tx.fecha)}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          backgroundColor: tx.tipo === 'RECARGA' ? '#ECFDF5' : '#FEE2E2',
                          color: tx.tipo === 'RECARGA' ? '#065F46' : '#991B1B'
                        }}>
                          {tx.tipo === 'RECARGA' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {tx.tipo}
                        </span>
                      </td>
                      <td style={{ 
                        fontWeight: '700', 
                        color: tx.tipo === 'RECARGA' ? '#059669' : '#DC2626' 
                      }}>
                        {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--espresso-dark)' }}>
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--espresso-dark)', margin: '0 0 0.5rem 0' }}>
              Código QR de Pago
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Presenta este código al cajero para escanear y aplicar tu cobro o recarga.
            </p>

            <div style={{ 
              display: 'inline-block', 
              padding: '1.25rem', 
              borderRadius: '1rem', 
              backgroundColor: '#fff', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(card.codigo)}`} 
                alt="QR Tarjeta" 
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '1.5rem', color: 'var(--espresso-dark)' }}>
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', animation: 'scaleIn 0.2s ease-out' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--espresso-dark)', margin: '0 0 0.5rem 0' }}>
              Cambiar Código PIN
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Ingresa un código numérico de 4 dígitos para autorizar pagos en el mostrador.
            </p>

            {pinError && (
              <div style={{ 
                backgroundColor: '#FEF2F2', 
                border: '1px solid #FECACA', 
                color: '#991B1B', 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                fontSize: '0.85rem'
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
                  className="form-control"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
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
                  className="form-control"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
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
