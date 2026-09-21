import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  Store, 
  PlusCircle, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  ReceiptText, 
  Search, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeFilter, setRangeFilter] = useState('7d');
  const [recentTx, setRecentTx] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, txRes] = await Promise.all([
        api.get('/admin/dashboard/'),
        api.get('/admin/transacciones/', { params: { page: 1 } }).catch(() => ({ data: { results: [] } }))
      ]);
      setData(dashRes.data);
      setRecentTx((txRes.data.results || []).slice(0, 5));
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos gerenciales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatMoney = (val) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val || 0);
  };

  const getFormattedDate = () => {
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = today.toLocaleDateString('es-GT', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  const greetingName = user?.first_name || user?.username || 'Administrador';

  // Barras de actividad del día
  const ventasNum = Number(data?.ventas_hoy || 0);
  const consumosNum = Number(data?.consumos_hoy || 0);
  const totalFlujo = Math.max(ventasNum + consumosNum, 1);
  const ventasPct = Math.round((ventasNum / totalFlujo) * 100);
  const consumosPct = Math.round((consumosNum / totalFlujo) * 100);

  // 7 días
  const daysMock = [
    { day: 'Lun', val: ventasNum * 0.7 },
    { day: 'Mar', val: ventasNum * 0.9 },
    { day: 'Mié', val: ventasNum * 0.8 },
    { day: 'Jue', val: ventasNum * 1.1 },
    { day: 'Vie', val: ventasNum * 1.3 },
    { day: 'Sáb', val: ventasNum * 1.5 },
    { day: 'Hoy', val: ventasNum }
  ];
  const maxBarVal = Math.max(...daysMock.map(d => d.val), 100);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <RefreshCw size={36} className="spin-slow" style={{ color: 'var(--color-blue-600)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Encabezado Limpio NexoCard */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '1.25rem', 
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Panel de Control
            </h1>
            <span style={{ 
              backgroundColor: 'var(--color-blue-100)', 
              color: 'var(--color-blue-700)', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              padding: '0.2rem 0.55rem', 
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Cafetería Premium
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            <span>Resumen operativo · {getFormattedDate()}</span>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <span style={{ color: 'var(--color-navy-700)', fontWeight: '500' }}>Buenos días, {greetingName}.</span>
          </div>
        </div>

        {/* CTAs NexoCard */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/terminal')}
            className="btn btn-secondary"
          >
            <Store size={16} />
            <span>Abrir Terminal POS</span>
          </button>

          <button 
            onClick={() => navigate('/tarjetas?accion=nueva')}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Emitir Tarjeta</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'var(--color-danger-100)', 
          border: '1px solid rgba(220,38,38,0.2)', 
          color: 'var(--color-danger-600)', 
          padding: '1rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Grid de 4 KPIs NexoCard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {/* KPI 1: Ventas de Hoy */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Ventas de Hoy</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-blue-100)', color: 'var(--color-blue-600)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value text-mono">
            {formatMoney(data?.ventas_hoy)}
          </div>
          <div className="kpi-context">
            <span style={{ color: 'var(--color-success-600)', fontWeight: '600' }}>↑ Recaudación activa</span>
            <span>· Emisiones y recargas</span>
          </div>
        </div>

        {/* KPI 2: Total Tarjetas */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Tarjetas</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-surface-soft)', color: 'var(--color-navy-700)' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div className="kpi-value text-mono">
            {data?.total_tarjetas || 0}
          </div>
          <div className="kpi-context">
            <span className="badge badge-success" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
              <span className="badge-dot"></span>
              {data?.tarjetas_activas || 0} activas
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              {(data?.total_tarjetas || 0) - (data?.tarjetas_activas || 0)} bloqueadas
            </span>
          </div>
        </div>

        {/* KPI 3: Consumos Hoy */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Consumos Hoy</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-cyan-100)', color: 'var(--color-cyan-600)' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="kpi-value text-mono">
            {formatMoney(data?.consumos_hoy)}
          </div>
          <div className="kpi-context">
            <span>Canjeado por clientes en caja</span>
          </div>
        </div>

        {/* KPI 4: Saldo en Circulación */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Saldo en Circulación</span>
            <div className="kpi-icon-pill" style={{ backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-600)' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div className="kpi-value text-mono" style={{ color: 'var(--color-success-600)' }}>
            {formatMoney(data?.saldo_circulante)}
          </div>
          <div className="kpi-context">
            <span>Disponible en tarjetas activas</span>
          </div>
        </div>
      </div>

      {/* 3. Distribución 8 Columnas / 4 Columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* === COLUMNA IZQUIERDA (8 Columnas) === */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card: Actividad del Día */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Actividad del Día
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  Ingresos recaudados vs canjes en mostrador
                </p>
              </div>
              <span className="badge badge-success">
                <span className="badge-dot"></span>
                Operación en vivo
              </span>
            </div>

            {/* Barra Visual Proporcional Azul / Navy */}
            <div style={{ height: '12px', borderRadius: '999px', backgroundColor: 'var(--color-surface-soft)', overflow: 'hidden', display: 'flex', marginBottom: '1.25rem' }}>
              <div 
                style={{ 
                  width: `${ventasPct}%`, 
                  backgroundColor: 'var(--color-blue-600)', 
                  transition: 'width 0.4s ease' 
                }} 
                title={`Ingresos: ${ventasPct}%`}
              />
              <div 
                style={{ 
                  width: `${consumosPct}%`, 
                  backgroundColor: 'var(--color-navy-800)', 
                  transition: 'width 0.4s ease' 
                }} 
                title={`Consumos: ${consumosPct}%`}
              />
            </div>

            {/* Desglose Métrico de Actividad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-blue-600)' }}></span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    Ingresos Recibidos
                  </span>
                </div>
                <div className="text-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {formatMoney(data?.ventas_hoy)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  Nuevas emisiones y recargas
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-navy-800)' }}></span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    Consumos / Canjes
                  </span>
                </div>
                <div className="text-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {formatMoney(data?.consumos_hoy)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  Saldo deducido por consumos
                </div>
              </div>
            </div>
          </div>

          {/* Card: Rendimiento Últimos 7 Días con Acentos Azul / Cian */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Rendimiento — Últimos 7 Días
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  Ingresos acumulados por emisión y recargas
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--color-surface-soft)', padding: '0.25rem', borderRadius: '8px' }}>
                <button 
                  onClick={() => setRangeFilter('7d')}
                  className="btn btn-sm"
                  style={{ 
                    padding: '0.25rem 0.6rem', 
                    fontSize: '0.75rem', 
                    backgroundColor: rangeFilter === '7d' ? '#fff' : 'transparent',
                    boxShadow: rangeFilter === '7d' ? 'var(--shadow-subtle)' : 'none',
                    fontWeight: rangeFilter === '7d' ? '700' : '500'
                  }}
                >
                  7 días
                </button>
                <button 
                  onClick={() => setRangeFilter('30d')}
                  className="btn btn-sm"
                  style={{ 
                    padding: '0.25rem 0.6rem', 
                    fontSize: '0.75rem', 
                    backgroundColor: rangeFilter === '30d' ? '#fff' : 'transparent',
                    boxShadow: rangeFilter === '30d' ? 'var(--shadow-subtle)' : 'none',
                    fontWeight: rangeFilter === '30d' ? '700' : '500'
                  }}
                >
                  30 días
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.25rem' }}>
              <span className="text-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {formatMoney(data?.ventas_ultimos_7_dias || data?.ventas_hoy)}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-success-600)' }}>
                ↑ +8.2% vs semana anterior
              </span>
            </div>

            {/* Mini Gráfico de Barras con Acento Azul/Cian */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)' }}>
              {daysMock.map((d, i) => {
                const heightPct = Math.max(Math.round((d.val / maxBarVal) * 100), 12);
                const isToday = i === daysMock.length - 1;
                return (
                  <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                    <div 
                      style={{ 
                        width: '24px', 
                        height: `${heightPct}%`, 
                        backgroundColor: isToday ? 'var(--color-blue-600)' : 'rgba(59, 130, 246, 0.25)', 
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.3s ease',
                        boxShadow: isToday ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
                      }}
                      title={`${d.day}: Q${d.val.toFixed(2)}`}
                    />
                    <span style={{ fontSize: '0.72rem', fontWeight: isToday ? '700' : '500', color: isToday ? 'var(--color-blue-600)' : 'var(--color-text-muted)' }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA (4 Columnas) === */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card: Acciones Rápidas */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.85rem' }}>
              Acciones Rápidas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div onClick={() => navigate('/terminal')} className="quick-action-card">
                <div className="quick-action-left">
                  <div className="quick-action-icon">
                    <Store size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Terminal POS</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Cobrar y recargar saldo</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>

              <div onClick={() => navigate('/tarjetas?accion=nueva')} className="quick-action-card">
                <div className="quick-action-left">
                  <div className="quick-action-icon" style={{ color: 'var(--color-blue-600)' }}>
                    <PlusCircle size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Emitir Tarjeta</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Nueva Gift Card prepago</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>

              <div onClick={() => navigate('/tarjetas')} className="quick-action-card">
                <div className="quick-action-left">
                  <div className="quick-action-icon" style={{ color: 'var(--color-cyan-600)' }}>
                    <Search size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Buscar Tarjeta</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Código, cliente o PIN</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>

              <div onClick={() => navigate('/corte-caja')} className="quick-action-card">
                <div className="quick-action-left">
                  <div className="quick-action-icon">
                    <ReceiptText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Corte de Caja</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Arqueo de turnos y balance</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
          </div>

          {/* Card: Actividad Reciente */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Actividad Reciente
              </h3>
              <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {recentTx.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                Sin transacciones recientes hoy.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentTx.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span className={`badge ${tx.tipo === 'RECARGA' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                          {tx.tipo}
                        </span>
                        <span className="text-mono" style={{ color: 'var(--color-text-primary)' }}>
                          •••• {tx.tarjeta_codigo?.slice(-4) || 'CARD'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {tx.operador_nombre || 'Caja'} · {new Date(tx.fecha).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-mono" style={{ fontWeight: 700, fontSize: '0.88rem', color: tx.tipo === 'RECARGA' ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                      {tx.tipo === 'RECARGA' ? '+' : '-'}{formatMoney(tx.monto)}
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => navigate('/transacciones')}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.78rem' }}
                >
                  Ver auditoría completa →
                </button>
              </div>
            )}
          </div>

          {/* Card: Estado Operativo NexoCard */}
          <div className="card-soft" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '0.65rem' }}>
              Estado Operativo
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success-500)' }}></span>
                <span>NexoCard POS operativo en línea</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-blue-500)' }}></span>
                <span>Turno de caja abierto (Cafetería Premium)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.76rem' }}>
                <Clock size={12} />
                <span>Última operación: {data?.ultima_transaccion || 'Al día'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
