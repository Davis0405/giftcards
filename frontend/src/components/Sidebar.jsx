import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Coffee, 
  LayoutDashboard, 
  CreditCard, 
  ReceiptText, 
  ShieldCheck, 
  Store, 
  LogOut, 
  ChevronUp, 
  User, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isStaff, isCashier, isCustomer } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar dropdown al cambiar de ruta
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isStaff) return 'Gerente';
    if (isCashier) return 'Cajero';
    return 'Cliente';
  };

  return (
    <aside className="sidebar">
      {/* 1. Header con Branding */}
      <div className="sidebar-header">
        <div className="brand-icon-wrapper">
          <Coffee size={22} strokeWidth={2.4} />
        </div>
        <div className="brand-text">
          <span className="brand-title">Cafetería Premium</span>
          <span className="brand-subtitle">Gift Card System</span>
        </div>
      </div>

      {/* 2. Navegación Categorizada */}
      <nav className="sidebar-nav">
        {/* Grupo Gerencia / Staff */}
        {isStaff && (
          <div>
            <div className="sidebar-group-title">Administración</div>
            <ul className="sidebar-group-items">
              <li>
                <NavLink 
                  to="/" 
                  end 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/tarjetas" 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <CreditCard size={18} />
                  <span>Tarjetas</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/transacciones" 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <ShieldCheck size={18} />
                  <span>Auditoría</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}

        {/* Grupo Operación en Mostrador (Cajeros y Staff) */}
        {(isCashier || isStaff) && (
          <div>
            <div className="sidebar-group-title">Operación en Caja</div>
            <ul className="sidebar-group-items">
              <li>
                <NavLink 
                  to="/terminal" 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Store size={18} />
                  <span>Terminal POS</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/corte-caja" 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <ReceiptText size={18} />
                  <span>Corte de Caja</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}

        {/* Grupo Mi Cuenta (Cliente) */}
        {isCustomer && !isStaff && !isCashier && (
          <div>
            <div className="sidebar-group-title">Mi Cuenta</div>
            <ul className="sidebar-group-items">
              <li>
                <NavLink 
                  to="/mi-tarjeta" 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <CreditCard size={18} />
                  <span>Mi Tarjeta</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* 3. Footer con Perfil de Usuario y Menú Desplegable */}
      <div className="sidebar-footer" ref={dropdownRef}>
        {dropdownOpen && (
          <div className="user-dropdown">
            <div style={{ padding: '0.5rem 0.75rem 0.65rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.35rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                {user?.email || `${user?.username}@cafeteria.com`}
              </div>
            </div>

            {isStaff && (
              <NavLink to="/mi-tarjeta" className="user-dropdown-item">
                <CreditCard size={16} />
                <span>Ver Mi Tarjeta Personal</span>
              </NavLink>
            )}

            <button 
              onClick={handleLogout}
              className="user-dropdown-item danger"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        <button 
          className="user-profile-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          type="button"
          aria-expanded={dropdownOpen}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div className="user-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-gold-400)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                {getRoleBadge()}
              </div>
            </div>
          </div>
          <ChevronUp 
            size={16} 
            style={{ 
              color: 'rgba(255,255,255,0.5)', 
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0
            }} 
          />
        </button>
      </div>
    </aside>
  );
}
