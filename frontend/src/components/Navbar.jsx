import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Coffee, 
  LayoutDashboard, 
  CreditCard, 
  ReceiptText, 
  ShieldCheck, 
  UserCircle2, 
  LogOut, 
  Store 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isStaff, isCashier, isCustomer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <div className="brand-badge">
            <Coffee size={24} />
          </div>
          <div>
            <div className="brand-title">Cafetería Premium</div>
            <div className="brand-subtitle">Gift Card System</div>
          </div>
        </Link>

        <ul className="nav-links">
          {/* Navegación para Gerencia / Staff */}
          {isStaff && (
            <>
              <li>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/tarjetas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <CreditCard size={18} />
                  <span>Tarjetas</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/transacciones" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ShieldCheck size={18} />
                  <span>Auditoría</span>
                </NavLink>
              </li>
            </>
          )}

          {/* Navegación para Cajeros y Terminal */}
          {isCashier && (
            <>
              <li>
                <NavLink to="/terminal" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Store size={18} />
                  <span>Terminal POS</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/corte-caja" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ReceiptText size={18} />
                  <span>Corte de Caja</span>
                </NavLink>
              </li>
            </>
          )}

          {/* Portal de Cliente */}
          {isCustomer && !isStaff && !isCashier && (
            <li>
              <NavLink to="/mi-tarjeta" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <CreditCard size={18} />
                <span>Mi Tarjeta</span>
              </NavLink>
            </li>
          )}
        </ul>

        {/* Sección de Usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <UserCircle2 size={24} color="var(--accent-gold)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                {user?.username}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isStaff ? 'Gerente' : isCashier ? 'Cajero' : 'Cliente'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
