import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Mail, 
  ArrowDownRight, 
  ArrowUpRight, 
  Receipt,
  Store
} from 'lucide-react';

export default function CorteCajaPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchCorte = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/pos/corte-caja/');
      const d = res.data;
      setData({
        fecha: d.fecha,
        caja_cerrada: d.caja_cerrada,
        cajero: d.cajero,
        hora_cierre: d.hora_cierre,
        ventas_totales: Number(d.consumos_hoy ?? d.ventas_totales ?? 0),
        recargas_totales: Number(d.cargas_hoy ?? d.recargas_totales ?? 0),
        total_transacciones: d.cantidad_operaciones ?? d.total_transacciones ?? 0,
        transacciones: (d.movimientos || d.transacciones || []).map(m => ({
          ...m,
          tipo: (m.tipo === 'CARGA' ? 'RECARGA' : m.tipo),
          tarjeta_codigo: m.tarjeta_codigo || m.tarjeta_id || 'Tarjeta'
        }))
      });
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos del corte de caja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorte();
  }, []);

  const handleCerrarCaja = async () => {
    try {
      setClosing(true);
      setError(null);
      const res = await api.post('/pos/corte-caja/cerrar/');
      setSuccessMsg(res.data.message || 'Caja cerrada exitosamente. Reporte enviado por correo.');
      setShowConfirmModal(false);
      fetchCorte();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar el cierre de caja.');
      setShowConfirmModal(false);
    } finally {
      setClosing(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount || 0);
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--color-blue-600)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Corte Diario de Caja
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
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Resumen operativo y arqueo de turnos del día ({data?.fecha || new Date().toLocaleDateString('es-GT')})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={fetchCorte} 
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
            <span>Actualizar</span>
          </button>

          {data?.caja_cerrada ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1.15rem', 
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-warning-100)',
              color: 'var(--color-warning-600)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid rgba(217, 119, 6, 0.25)'
            }}>
              <Lock size={16} />
              <span>Caja del Día Cerrada</span>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-primary"
            >
              <Lock size={16} />
              <span>Efectuar Cierre de Caja</span>
            </button>
          )}
        </div>
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
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Métricas Principales NexoCard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {/* Total Consumos / Ventas */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <span className="kpi-label">Consumos Canjeados</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-danger-100)', color: 'var(--color-danger-600)' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="text-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            {formatMoney(data?.ventas_totales)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Cobros deducidos de tarjetas en caja
          </div>
        </div>

        {/* Total Recargas */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <span className="kpi-label">Recargas / Ingresos</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-blue-100)', color: 'var(--color-blue-600)' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-blue-600)', marginBottom: '0.25rem' }}>
            {formatMoney(data?.recargas_totales)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Efectivo/tarjeta ingresado a saldo
          </div>
        </div>

        {/* Total Transacciones */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <span className="kpi-label">Operaciones del Día</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-cyan-100)', color: 'var(--color-cyan-600)' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
            {data?.total_transacciones || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Movimientos procesados en terminal
          </div>
        </div>

        {/* Flujo Neto */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <span className="kpi-label">Flujo Neto Ingresado</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-600)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success-600)', marginBottom: '0.25rem' }}>
            {formatMoney((data?.recargas_totales || 0) - (data?.ventas_totales || 0))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Diferencial neto (Recargas - Canjes)
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos del Día */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Movimientos del Turno
            </h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
              Auditoría detallada de cada operación registrada en Cafetería Premium hoy
            </p>
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Total: {data?.transacciones?.length || 0}
          </span>
        </div>

        {!data?.transacciones || data.transacciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
            <Receipt size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No se han registrado transacciones el día de hoy.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Tarjeta</th>
                  <th>Monto</th>
                  <th>Cajero / Operador</th>
                </tr>
              </thead>
              <tbody>
                {data.transacciones.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {formatFecha(tx.fecha)}
                    </td>
                    <td>
                      <span className={`badge ${tx.tipo === 'RECARGA' ? 'badge-success' : 'badge-danger'}`}>
                        <span className="badge-dot"></span>
                        {tx.tipo}
                      </span>
                    </td>
                    <td>
                      <span className="text-mono" style={{ fontWeight: 700 }}>
                        {tx.tarjeta_codigo || 'Tarjeta'}
                      </span>
                    </td>
                    <td className="text-mono" style={{ 
                      fontWeight: 700, 
                      color: tx.tipo === 'RECARGA' ? 'var(--color-success-600)' : 'var(--color-danger-600)' 
                    }}>
                      {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {tx.operador_nombre || 'Cajero'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmación Cierre */}
      {showConfirmModal && (
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-warning-100)', 
                color: 'var(--color-warning-600)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Lock size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
                ¿Efectuar Cierre de Caja?
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                Esta acción bloqueará las operaciones del día actual, generará el balance final y enviará el reporte PDF por correo electrónico.
              </p>
            </div>

            <div style={{ 
              backgroundColor: 'var(--color-surface-soft)', 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              border: '1px solid var(--color-border)',
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Consumos:</span>
                <span className="text-mono" style={{ fontWeight: 700 }}>{formatMoney(data?.ventas_totales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Recargas:</span>
                <span className="text-mono" style={{ fontWeight: 700, color: 'var(--color-blue-600)' }}>{formatMoney(data?.recargas_totales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)' }}>
                <span style={{ fontWeight: 700 }}>Operaciones:</span>
                <span className="text-mono" style={{ fontWeight: 700 }}>{data?.total_transacciones || 0}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setShowConfirmModal(false)}
                disabled={closing}
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleCerrarCaja}
                disabled={closing}
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                {closing ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
