import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Lock, 
  Unlock, 
  FileDown, 
  Trash2, 
  KeyRound, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Dices,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TarjetasPage() {
  const [searchParams] = useSearchParams();
  const [tarjetas, setTarjetas] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ pagina_actual: 1, total_paginas: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showQrModal, setShowQrModal] = useState(null);

  // Formulario de Creación
  const [newCard, setNewCard] = useState({
    saldo: '100.00',
    fecha_vencimiento: '',
    pin: '',
    email_cliente: ''
  });
  const [newPinValue, setNewPinValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detección de query param para auto-abrir modal
  useEffect(() => {
    if (searchParams.get('accion') === 'nueva') {
      setIsCreateModalOpen(true);
      handleRandomPin();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTarjetas(1);
  }, [statusFilter]);

  const fetchTarjetas = async (page = 1, searchQuery = search) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        status: statusFilter,
        search: searchQuery
      };
      const res = await api.get('/admin/tarjetas/', { params });
      setTarjetas(res.data.tarjetas);
      setPagination(res.data.paginacion);
      setStats(res.data.estadisticas);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el listado de tarjetas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTarjetas(1, search);
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRandomPin = () => {
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    setNewCard((prev) => ({ ...prev, pin: random }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        saldo_inicial: parseFloat(newCard.saldo) || 0,
        pin: newCard.pin,
        titular_email: newCard.email_cliente || null
      };

      if (newCard.fecha_vencimiento) {
        payload.fecha_vencimiento = newCard.fecha_vencimiento;
      }

      const res = await api.post('/admin/tarjetas/crear/', payload);
      setSuccess(`Tarjeta emitida con éxito: PIN asignado [ ${res.data.pin} ]`);
      setIsCreateModalOpen(false);
      setNewCard({ saldo: '100.00', fecha_vencimiento: '', pin: '', email_cliente: '' });
      fetchTarjetas(1);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al emitir la tarjeta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBlock = async (cardId) => {
    try {
      setError('');
      const res = await api.post(`/admin/tarjetas/${cardId}/bloquear/`);
      setSuccess(res.data.mensaje);
      setTarjetas((prev) =>
        prev.map((t) => (t.id === cardId ? { ...t, activa: res.data.activa } : t))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Error al modificar estado de la tarjeta.');
    }
  };

  const handleOpenPinModal = (card) => {
    setSelectedCard(card);
    setNewPinValue('');
    setIsPinModalOpen(true);
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (newPinValue.length !== 4 || !/^\d{4}$/.test(newPinValue)) {
      setError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post(`/admin/tarjetas/${selectedCard.id}/pin/`, { pin: newPinValue });
      setSuccess(res.data.mensaje);
      setIsPinModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarjeta permanentemente?')) return;
    try {
      setError('');
      await api.delete(`/admin/tarjetas/${cardId}/`);
      setSuccess('Tarjeta eliminada correctamente.');
      fetchTarjetas(pagination.pagina_actual);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la tarjeta.');
    }
  };

  const handleDownloadPDF = async (cardId) => {
    try {
      const response = await api.get(`/tarjetas/${cardId}/pdf/`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `GiftCard_${cardId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al generar y descargar el PDF de la tarjeta.');
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val || 0);
  };

  return (
    <div>
      {/* 1. Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Gestión de Tarjetas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0.25rem 0 0 0' }}>
            Emisión, control de seguridad, saldos y supervisión de Gift Cards
          </p>
        </div>

        <button 
          onClick={() => { setIsCreateModalOpen(true); handleRandomPin(); }} 
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Emitir Tarjeta</span>
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-danger-100)', 
          border: '1px solid rgba(198,40,40,0.2)', 
          color: 'var(--color-danger-600)', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ 
          backgroundColor: 'var(--color-success-100)', 
          border: '1px solid rgba(19,138,69,0.2)', 
          color: 'var(--color-success-600)', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {/* 2. Estadísticas Rápidas */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Total Emitidas</span>
            <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>{stats.total}</div>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Tarjetas Activas</span>
            <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success-600)', marginTop: '0.2rem' }}>{stats.activas}</div>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Saldo en Circulación</span>
            <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-gold-600)', marginTop: '0.2rem' }}>{formatMoney(stats.saldo_total)}</div>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Bloqueadas</span>
            <div className="text-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-danger-600)', marginTop: '0.2rem' }}>{stats.bloqueadas}</div>
          </div>
        </div>
      )}

      {/* 3. Toolbar de Búsqueda y Filtros */}
      <div className="card" style={{ padding: '1.15rem', marginBottom: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Buscar por código, cliente o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="active">Activas con Saldo</option>
            <option value="blocked">Bloqueadas</option>
            <option value="depleted">Saldo Agotado (Q0)</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filtrar
          </button>
        </form>
      </div>

      {/* 4. Tabla de Tarjetas Enriquecida */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Identificador (UUID)</th>
              <th>Titular / Cliente</th>
              <th>Saldo</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                  Cargando tarjetas...
                </td>
              </tr>
            ) : tarjetas.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  No se encontraron tarjetas con los filtros aplicados.
                </td>
              </tr>
            ) : (
              tarjetas.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="text-mono" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        •••• {t.id.slice(-6)}
                      </span>
                      <button 
                        onClick={() => handleCopy(t.id)} 
                        className="btn btn-sm"
                        style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                        title="Copiar UUID completo"
                      >
                        {copiedId === t.id ? <Check size={14} style={{ color: 'var(--color-success-600)' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{t.dueno_username || t.email_cliente || 'Al Portador'}</strong>
                      {t.email_cliente && t.dueno_username && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.email_cliente}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                      {formatMoney(t.saldo)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {t.fecha_vencimiento || 'Sin límite'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.activa ? 'badge-success' : 'badge-danger'}`}>
                      <span className="badge-dot"></span>
                      {t.activa ? 'ACTIVA' : 'BLOQUEADA'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      {/* Ver QR */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowQrModal(t)}
                        title="Ver Código QR"
                      >
                        <QrCode size={14} />
                      </button>

                      {/* Descargar PDF */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPDF(t.id)}
                        title="Descargar PDF imprimible"
                      >
                        <FileDown size={14} />
                      </button>

                      {/* Cambiar PIN */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenPinModal(t)}
                        title="Cambiar PIN"
                      >
                        <KeyRound size={14} />
                      </button>

                      {/* Bloquear / Desbloquear */}
                      <button
                        className={`btn btn-sm ${t.activa ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleBlock(t.id)}
                        title={t.activa ? 'Bloquear Tarjeta' : 'Desbloquear Tarjeta'}
                      >
                        {t.activa ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>

                      {/* Eliminar (solo si no tiene movimientos) */}
                      {t.movimientos_count === 0 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(t.id)}
                          title="Eliminar Tarjeta"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.total_paginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!pagination.tiene_anterior}
            onClick={() => fetchTarjetas(pagination.pagina_actual - 1)}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Página {pagination.pagina_actual} de {pagination.total_paginas}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!pagination.tiene_siguiente}
            onClick={() => fetchTarjetas(pagination.pagina_actual + 1)}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 5. Modal: Emitir Nueva Tarjeta con Montos Rápidos (Brief Sec. 19) */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(36, 19, 7, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--color-gold-500)' }} />
                <span>Emitir Tarjeta de Regalo</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {/* Montos Rápidos */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Monto Inicial</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.6rem' }}>
                  {['50.00', '100.00', '200.00', '500.00'].map((val) => (
                    <button 
                      key={val}
                      type="button"
                      onClick={() => setNewCard({ ...newCard, saldo: val })}
                      className="btn btn-secondary btn-sm"
                      style={{ 
                        fontWeight: '700',
                        backgroundColor: newCard.saldo === val ? 'var(--color-gold-soft)' : 'var(--color-surface)',
                        borderColor: newCard.saldo === val ? 'var(--color-gold-500)' : 'var(--color-border)'
                      }}
                    >
                      Q{Number(val)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  className="form-control text-mono"
                  style={{ fontSize: '1.2rem', fontWeight: 700 }}
                  value={newCard.saldo}
                  onChange={(e) => setNewCard({ ...newCard, saldo: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Correo del Titular (Opcional)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="cliente@ejemplo.com"
                  value={newCard.email_cliente}
                  onChange={(e) => setNewCard({ ...newCard, email_cliente: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>PIN de Seguridad (4 dígitos)</label>
                  <button
                    type="button"
                    onClick={handleRandomPin}
                    className="btn btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: 'transparent', color: 'var(--color-gold-600)', border: 'none' }}
                  >
                    <Dices size={14} />
                    <span>Generar</span>
                  </button>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  className="form-control text-mono"
                  placeholder="1234"
                  style={{ textAlign: 'center', fontSize: '1.35rem', letterSpacing: '0.35em' }}
                  value={newCard.pin}
                  onChange={(e) => setNewCard({ ...newCard, pin: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Emitiendo...' : 'Emitir Tarjeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cambiar PIN */}
      {isPinModalOpen && selectedCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(36, 19, 7, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
              Cambiar PIN de Tarjeta
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Tarjeta •••• {selectedCard.id?.slice(-6)}
            </p>

            <form onSubmit={handleUpdatePin}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Nuevo PIN (4 dígitos numéricos)</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  className="form-control text-mono"
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em' }}
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsPinModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver QR de la tarjeta */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(36, 19, 7, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
              Código QR de la Tarjeta
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Escanee en Terminal POS para realizar operaciones
            </p>

            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'inline-block', marginBottom: '1.25rem' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(showQrModal.id)}`} 
                alt="QR Tarjeta" 
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div className="text-mono" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              {showQrModal.id}
            </div>

            <button onClick={() => setShowQrModal(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
