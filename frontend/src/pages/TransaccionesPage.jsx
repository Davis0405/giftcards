import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  Receipt, 
  ArrowDownRight, 
  ArrowUpRight, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Calendar, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransacciones = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page };
      if (tipo) params.tipo = tipo;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await api.get('/admin/transacciones/', { params });
      setTransacciones(res.data.results || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalCount(res.data.count || 0);
      setCurrentPage(res.data.current_page || page);
    } catch (err) {
      console.error(err);
      setError('Error al obtener el historial de transacciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacciones(1);
  }, [tipo, fechaInicio, fechaFin]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchTransacciones(1);
  };

  const handleClearFilters = () => {
    setTipo('');
    setFechaInicio('');
    setFechaFin('');
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount || 0);
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportCSV = () => {
    if (!transacciones.length) return;
    const headers = ['ID', 'Fecha', 'Tipo', 'Código Tarjeta', 'Titular', 'Monto', 'Saldo Anterior', 'Saldo Resultante', 'Operador', 'IP'];
    const rows = transacciones.map(t => [
      t.id,
      t.fecha,
      t.tipo,
      `"${t.tarjeta_codigo || ''}"`,
      `"${t.titular_nombre || ''}"`,
      t.monto,
      t.saldo_anterior,
      t.saldo_resultante,
      `"${t.operador_nombre || ''}"`,
      t.ip_address || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_transacciones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📜</span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--espresso-dark)', margin: 0 }}>
              Auditoría de Transacciones
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Registro global inmutable de consumos, recargas y operaciones del sistema
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportCSV} 
            disabled={!transacciones.length}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button 
            onClick={() => fetchTransacciones(currentPage)} 
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
            Actualizar
          </button>
        </div>
      </div>

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

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label className="form-label">Tipo de Movimiento</label>
            <select 
              className="form-control" 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="CONSUMO">Consumos (Cobros)</option>
              <option value="RECARGA">Recargas (Ingresos)</option>
            </select>
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label className="form-label">Desde</label>
            <input 
              type="date" 
              className="form-control" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label className="form-label">Hasta</label>
            <input 
              type="date" 
              className="form-control" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={handleClearFilters} className="btn btn-secondary">
              Limpiar
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} />
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Resultados */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: '600', color: 'var(--espresso-dark)' }}>
            Total registros encontrados: <span style={{ color: 'var(--amber-gold)', fontWeight: '800' }}>{totalCount}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Página {currentPage} de {totalPages}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--amber-gold)' }} />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Cargando registros de auditoría...</p>
          </div>
        ) : transacciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <Receipt size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No se encontraron transacciones con los criterios seleccionados.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Tipo</th>
                    <th>Tarjeta / Titular</th>
                    <th>Monto</th>
                    <th>Saldo Anterior</th>
                    <th>Saldo Resultante</th>
                    <th>Operador / IP</th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
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
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--espresso-dark)' }}>
                          {tx.tarjeta_codigo || 'Tarjeta'}
                        </div>
                        {tx.titular_nombre && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {tx.titular_nombre}
                          </div>
                        )}
                      </td>
                      <td style={{ 
                        fontWeight: '800', 
                        color: tx.tipo === 'RECARGA' ? '#059669' : '#DC2626' 
                      }}>
                        {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {formatMoney(tx.saldo_anterior)}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--espresso-dark)', fontSize: '0.95rem' }}>
                        {formatMoney(tx.saldo_resultante)}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--espresso-dark)', fontSize: '0.85rem' }}>
                          {tx.operador_nombre || 'Sistema'}
                        </div>
                        {tx.ip_address && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {tx.ip_address}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => fetchTransacciones(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--espresso-dark)' }}>
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => fetchTransacciones(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
