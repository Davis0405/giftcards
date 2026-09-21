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
  Calendar, 
  Receipt,
  FileSpreadsheet
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
        <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--amber-gold)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📋</span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--espresso-dark)', margin: 0 }}>
              Corte Diario de Caja
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Resumen en tiempo real de ventas, recargas y arqueo de turnos del día ({data?.fecha || new Date().toLocaleDateString('es-GT')})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={fetchCorte} 
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
            Actualizar
          </button>

          {data?.caja_cerrada ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.65rem 1.25rem', 
              borderRadius: '9999px',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: '700',
              border: '1px solid #FCD34D'
            }}>
              <Lock size={16} />
              Caja del Día Cerrada
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(180, 83, 9, 0.3)' }}
            >
              <Lock size={16} />
              Efectuar Cierre de Caja
            </button>
          )}
        </div>
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
          <AlertTriangle size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Status Banner if closed */}
      {data?.caja_cerrada && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', 
          border: '1px solid #F59E0B',
          marginBottom: '2rem',
          padding: '1.25rem 1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              backgroundColor: '#F59E0B', 
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#92400E', margin: '0 0 0.25rem 0' }}>
                El corte definitivo de caja ya ha sido completado para hoy
              </h3>
              <p style={{ margin: 0, color: '#B45309', fontSize: '0.9rem' }}>
                El archivo de arqueo y balance fue generado y enviado automáticamente por correo electrónico a la administración.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '2rem' 
      }}>
        {/* Total Consumos / Ventas */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Consumos / Ventas Hoy
            </span>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              backgroundColor: '#FEE2E2', 
              color: '#DC2626', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ArrowDownRight size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--espresso-dark)', marginBottom: '0.25rem' }}>
            {formatMoney(data?.ventas_totales)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Cobros deducidos de Gift Cards
          </div>
        </div>

        {/* Total Recargas */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Recargas Ingresadas Hoy
            </span>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              backgroundColor: '#ECFDF5', 
              color: '#059669', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#059669', marginBottom: '0.25rem' }}>
            {formatMoney(data?.recargas_totales)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Efectivo/tarjeta ingresado a saldo
          </div>
        </div>

        {/* Total Transacciones */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Operaciones Realizadas
            </span>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              backgroundColor: '#EFF6FF', 
              color: '#2563EB', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Receipt size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--espresso-dark)', marginBottom: '0.25rem' }}>
            {data?.total_transacciones || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Movimientos procesados en terminal
          </div>
        </div>

        {/* Balance Neto */}
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(212, 175, 55, 0.08) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Flujo Neto Recibido
            </span>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              backgroundColor: '#FEF3C7', 
              color: 'var(--amber-gold)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--espresso-dark)', marginBottom: '0.25rem' }}>
            {formatMoney((data?.recargas_totales || 0) - (data?.ventas_totales || 0))}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Diferencial (Recargas - Consumos)
          </div>
        </div>
      </div>

      {/* Desglose por Operador / Tipo */}
      {data?.desglose && Object.keys(data.desglose).length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--espresso-dark)', marginBottom: '1rem' }}>
            Desglose por Modalidad
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(data.desglose).map(([tipo, info]) => (
              <div key={tipo} style={{ 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                backgroundColor: 'var(--bg-light)', 
                border: '1px solid var(--border-color)' 
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  {tipo}
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--espresso-dark)' }}>
                  {formatMoney(info.total)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {info.cantidad} operaciones
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Transacciones de Hoy */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--espresso-dark)', margin: '0 0 0.25rem 0' }}>
              Movimientos del Día
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Auditoría detallada de cada operación registrada hoy
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Total: {data?.transacciones?.length || 0}
          </span>
        </div>

        {!data?.transacciones || data.transacciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Receipt size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No se han registrado transacciones el día de hoy.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
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
                    <td style={{ fontWeight: '500', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatFecha(tx.fecha)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
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
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--espresso-dark)' }}>
                        {tx.tarjeta_codigo || 'Tarjeta'}
                      </span>
                    </td>
                    <td style={{ 
                      fontWeight: '700', 
                      color: tx.tipo === 'RECARGA' ? '#059669' : '#DC2626' 
                    }}>
                      {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {tx.operador_nombre || 'Sistema'}
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: '#FEF3C7', 
                color: '#D97706', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Lock size={32} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--espresso-dark)', margin: '0 0 0.5rem 0' }}>
                ¿Confirmar Cierre de Caja?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
                Esta acción bloqueará las operaciones del día actual, generará el balance final y enviará el reporte PDF por correo electrónico a la administración.
              </p>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-light)', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Ventas:</span>
                <span style={{ fontWeight: '700' }}>{formatMoney(data?.ventas_totales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Recargas:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{formatMoney(data?.recargas_totales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ fontWeight: '700' }}>Transacciones Registradas:</span>
                <span style={{ fontWeight: '700' }}>{data?.total_transacciones || 0}</span>
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
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {closing ? (
                  <>
                    <RefreshCw size={16} className="spin-slow" />
                    Cerrando...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Confirmar Cierre
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
