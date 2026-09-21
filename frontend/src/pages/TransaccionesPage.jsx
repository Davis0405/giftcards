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
    link.setAttribute('download', `nexocard_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Auditoría y Trazabilidad
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
              NexoCard Security
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Registro global inmutable de consumos, recargas y operaciones en Cafetería Premium
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportCSV} 
            disabled={!transacciones.length}
            className="btn btn-secondary"
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={() => fetchTransacciones(currentPage)} 
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

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
          <AlertCircle size={20} />
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
            <button type="submit" className="btn btn-primary">
              <Filter size={16} />
              <span>Filtrar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Auditoría */}
      <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Registros encontrados: <span className="text-mono" style={{ color: 'var(--color-blue-600)', fontWeight: 800 }}>{totalCount}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            Página {currentPage} de {totalPages}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--color-blue-600)' }} />
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)' }}>Cargando registros de auditoría...</p>
          </div>
        ) : transacciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
            <Receipt size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No se encontraron transacciones con los criterios seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
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
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {formatFecha(tx.fecha)}
                      </td>
                      <td>
                        <span className={`badge ${tx.tipo === 'RECARGA' ? 'badge-success' : 'badge-danger'}`}>
                          <span className="badge-dot"></span>
                          {tx.tipo}
                        </span>
                      </td>
                      <td>
                        <div className="text-mono" style={{ fontWeight: 700 }}>
                          {tx.tarjeta_codigo || 'Tarjeta'}
                        </div>
                        {tx.titular_nombre && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                            {tx.titular_nombre}
                          </div>
                        )}
                      </td>
                      <td className="text-mono" style={{ 
                        fontWeight: 800, 
                        color: tx.tipo === 'RECARGA' ? 'var(--color-success-600)' : 'var(--color-danger-600)' 
                      }}>
                        {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                      </td>
                      <td className="text-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatMoney(tx.saldo_anterior)}
                      </td>
                      <td className="text-mono" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatMoney(tx.saldo_resultante)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {tx.operador_nombre || 'Sistema'}
                        </div>
                        {tx.ip_address && (
                          <div className="text-mono" style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => fetchTransacciones(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => fetchTransacciones(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Siguiente</span>
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
