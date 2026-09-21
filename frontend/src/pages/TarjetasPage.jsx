import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { 
  CreditCard, 
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
  AlertCircle, 
  CheckCircle2,
  Sparkles, 
  Dices, 
  QrCode,
  ShieldCheck,
  Coins,
  Ban
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Button, 
  Badge, 
  Card, 
  CardBody, 
  StatCard, 
  SearchInput, 
  Modal, 
  Skeleton 
} from '../components/ui';

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

  // Auto-abrir modal si query param viene con accion=nueva
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchClear = () => {
    setSearch('');
    fetchTarjetas(1, '');
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
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        saldo: parseFloat(newCard.saldo),
        pin: newCard.pin,
        email_cliente: newCard.email_cliente || undefined,
        fecha_vencimiento: newCard.fecha_vencimiento || undefined
      };

      await api.post('/admin/tarjetas/crear/', payload);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccess('Tarjeta emitida exitosamente.');
      setIsCreateModalOpen(false);
      setNewCard({ saldo: '100.00', fecha_vencimiento: '', pin: '', email_cliente: '' });
      fetchTarjetas(1);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al emitir la tarjeta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      setError('');
      const res = await api.post(`/admin/tarjetas/${id}/bloquear/`);
      setSuccess(res.data.mensaje);
      fetchTarjetas(pagination.pagina_actual);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo cambiar el estado de la tarjeta.');
    }
  };

  const handleOpenPinModal = (card) => {
    setSelectedCard(card);
    setNewPinValue('');
    setIsPinModalOpen(true);
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (newPinValue.length !== 4) {
      setError('El PIN debe contener exactamente 4 dígitos.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/admin/tarjetas/${selectedCard.id}/cambiar-pin/`, { pin: newPinValue });
      setSuccess('PIN actualizado correctamente.');
      setIsPinModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al actualizar el PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarjeta sin movimientos? Esta acción no se puede deshacer.')) return;

    try {
      setError('');
      await api.delete(`/admin/tarjetas/${id}/eliminar/`);
      setSuccess('Tarjeta eliminada con éxito.');
      fetchTarjetas(pagination.pagina_actual);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al eliminar la tarjeta.');
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const res = await api.get(`/tarjetas/${id}/descargar-pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tarjeta-NexoCard-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Error al descargar el PDF de la tarjeta.');
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val || 0);
  };

  return (
    <div>
      {/* 1. Encabezado Oficial NexoCard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-navy-950)', margin: 0, letterSpacing: '-0.02em' }}>
            Gestión de Tarjetas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0.25rem 0 0 0' }}>
            Emisión, saldos, seguridad y control operativo de Gift Cards NexoCard
          </p>
        </div>

        <Button 
          variant="primary"
          icon={Plus}
          onClick={() => { setIsCreateModalOpen(true); handleRandomPin(); }}
        >
          Emitir Tarjeta
        </Button>
      </div>

      {/* Alertas con Micro-animación */}
      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-danger-100)', 
          border: '1px solid rgba(239, 68, 68, 0.25)', 
          color: 'var(--color-danger-600)', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.88rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ 
          backgroundColor: 'var(--color-success-100)', 
          border: '1px solid rgba(34, 197, 94, 0.25)', 
          color: 'var(--color-success-600)', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.88rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {/* 2. KPIs Rápidos Reutilizables con StatCard */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.15rem',
          marginBottom: '1.5rem'
        }}>
          <StatCard
            title="Total Emitidas"
            value={stats.total}
            icon={CreditCard}
            color="blue"
            subtitle="Tarjetas registradas en el tenant"
          />
          <StatCard
            title="Tarjetas Activas"
            value={stats.activas}
            icon={ShieldCheck}
            color="emerald"
            subtitle="Operativas para consumo"
          />
          <StatCard
            title="Saldo en Circulación"
            value={formatMoney(stats.saldo_total)}
            icon={Coins}
            color="cyan"
            subtitle="Pasivo prepagado disponible"
          />
          <StatCard
            title="Tarjetas Bloqueadas"
            value={stats.bloqueadas}
            icon={Ban}
            color="amber"
            subtitle="Restringidas por seguridad"
          />
        </div>
      )}

      {/* 3. Toolbar con Componentes Reutilizables */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchInput
                placeholder="Buscar por código, cliente o email..."
                value={search}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
              />
            </div>

            <select
              className="search-input"
              style={{ width: 'auto', minWidth: '190px', padding: '0.65rem 1rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="active">Activas con Saldo</option>
              <option value="blocked">Bloqueadas</option>
              <option value="depleted">Saldo Agotado (Q0)</option>
            </select>

            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* 4. Tabla de Tarjetas Enriquecida */}
      <Card>
        <div className="table-container" style={{ margin: 0, borderRadius: 0, border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Identificador (UUID)</th>
                <th>Titular / Cliente</th>
                <th>Saldo Disponible</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td><Skeleton height="20px" width="120px" /></td>
                    <td><Skeleton height="20px" width="160px" /></td>
                    <td><Skeleton height="20px" width="90px" /></td>
                    <td><Skeleton height="20px" width="110px" /></td>
                    <td><Skeleton height="22px" width="75px" borderRadius="9999px" /></td>
                    <td style={{ textAlign: 'right' }}><Skeleton height="32px" width="140px" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : tarjetas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-muted)' }}>
                    <CreditCard size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, display: 'block' }} />
                    <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>No se encontraron tarjetas</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Prueba ajustando los filtros o emitiendo una nueva tarjeta.</div>
                  </td>
                </tr>
              ) : (
                tarjetas.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="text-mono" style={{ fontWeight: 700, color: 'var(--color-navy-950)' }}>
                          •••• {t.id.slice(-6)}
                        </span>
                        <button 
                          onClick={() => handleCopy(t.id)} 
                          className="btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.35rem', cursor: 'pointer', borderRadius: '6px' }}
                          title="Copiar UUID completo"
                        >
                          {copiedId === t.id ? <Check size={14} style={{ color: 'var(--color-success-600)' }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: 'var(--color-navy-950)' }}>{t.dueno_username || t.email_cliente || 'Al Portador'}</strong>
                        {t.email_cliente && t.dueno_username && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.email_cliente}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-mono tabular-nums" style={{ fontWeight: 800, fontSize: '1.025rem', color: 'var(--color-navy-950)' }}>
                        {formatMoney(t.saldo)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {t.fecha_vencimiento || 'Sin límite'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={t.activa ? 'success' : 'danger'} dot={t.activa}>
                        {t.activa ? 'ACTIVA' : 'BLOQUEADA'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {/* Ver QR */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowQrModal(t)}
                          title="Ver Código QR"
                        >
                          <QrCode size={14} />
                        </Button>

                        {/* Descargar PDF */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadPDF(t.id)}
                          title="Descargar PDF imprimible"
                        >
                          <FileDown size={14} />
                        </Button>

                        {/* Cambiar PIN */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPinModal(t)}
                          title="Cambiar PIN"
                        >
                          <KeyRound size={14} />
                        </Button>

                        {/* Bloquear / Desbloquear */}
                        <Button
                          variant={t.activa ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleBlock(t.id)}
                          title={t.activa ? 'Bloquear Tarjeta' : 'Desbloquear Tarjeta'}
                        >
                          {t.activa ? <Lock size={14} /> : <Unlock size={14} />}
                        </Button>

                        {/* Eliminar (solo si no tiene movimientos) */}
                        {t.movimientos_count === 0 && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(t.id)}
                            title="Eliminar Tarjeta"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Paginación Estandarizada */}
      {pagination.total_paginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.tiene_anterior}
            onClick={() => fetchTarjetas(pagination.pagina_actual - 1)}
            icon={ChevronLeft}
          >
            Anterior
          </Button>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy-800)' }}>
            Página {pagination.pagina_actual} de {pagination.total_paginas}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.tiene_siguiente}
            onClick={() => fetchTarjetas(pagination.pagina_actual + 1)}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* 6. Modal Reutilizable: Emitir Tarjeta */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Emitir Tarjeta de Regalo"
        subtitle="Crea una Gift Card con saldo inicial precargado y PIN de seguridad"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateSubmit}>
          {/* Montos Rápidos */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Monto Inicial (GTQ)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {['50.00', '100.00', '200.00', '500.00'].map((val) => (
                <button 
                  key={val}
                  type="button"
                  onClick={() => setNewCard({ ...newCard, saldo: val })}
                  className={`btn btn-sm ${newCard.saldo === val ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontWeight: 700 }}
                >
                  Q{Number(val)}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.00"
              className="search-input text-mono tabular-nums"
              style={{ fontSize: '1.25rem', fontWeight: 800 }}
              value={newCard.saldo}
              onChange={(e) => setNewCard({ ...newCard, saldo: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Correo del Titular (Opcional)</label>
            <input
              type="email"
              className="search-input"
              placeholder="cliente@ejemplo.com"
              value={newCard.email_cliente}
              onChange={(e) => setNewCard({ ...newCard, email_cliente: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.8125rem' }}>PIN de Seguridad (4 dígitos)</label>
              <button
                type="button"
                onClick={handleRandomPin}
                className="btn-ghost btn-sm"
                style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem', color: 'var(--color-blue-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Dices size={13} />
                <span>Generar Aleatorio</span>
              </button>
            </div>
            <input
              type="password"
              maxLength={4}
              pattern="\d{4}"
              className="search-input text-mono"
              placeholder="••••"
              style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.4em' }}
              value={newCard.pin}
              onChange={(e) => setNewCard({ ...newCard, pin: e.target.value.replace(/\D/g, '') })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Emitir Tarjeta
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal Reutilizable: Cambiar PIN */}
      <Modal
        isOpen={isPinModalOpen && !!selectedCard}
        onClose={() => setIsPinModalOpen(false)}
        title="Cambiar PIN de Tarjeta"
        subtitle={`Tarjeta •••• ${selectedCard?.id?.slice(-6)}`}
        maxWidth="400px"
      >
        <form onSubmit={handleUpdatePin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Nuevo PIN (4 dígitos numéricos)</label>
            <input
              type="password"
              maxLength={4}
              pattern="\d{4}"
              className="search-input text-mono"
              placeholder="••••"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em' }}
              value={newPinValue}
              onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPinModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Guardar PIN
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Modal Reutilizable: Ver Código QR */}
      <Modal
        isOpen={!!showQrModal}
        onClose={() => setShowQrModal(null)}
        title="Código QR de la Tarjeta"
        subtitle="Escanee en el Terminal POS para realizar cobros o recargas"
        maxWidth="380px"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            padding: '1.25rem', 
            backgroundColor: '#FFFFFF', 
            borderRadius: '16px', 
            border: '1px solid var(--color-border)', 
            display: 'inline-block', 
            boxShadow: 'var(--shadow-subtle)',
            marginBottom: '1rem' 
          }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(showQrModal?.id || '')}`} 
              alt="QR Tarjeta" 
              style={{ width: '200px', height: '200px', display: 'block' }}
            />
          </div>

          <div className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-navy-700)', fontWeight: 600, marginBottom: '1.5rem', wordBreak: 'break-all' }}>
            {showQrModal?.id}
          </div>

          <Button variant="primary" style={{ width: '100%' }} onClick={() => setShowQrModal(null)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
