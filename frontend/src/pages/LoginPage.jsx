import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import nexocardLogo from '../assets/nexocard.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      // Redirección inteligente según rol
      if (user.is_staff || user.is_superuser) {
        navigate('/');
      } else if (user.groups?.includes('Cajeros') || user.role === 'CAJERO') {
        navigate('/terminal');
      } else {
        navigate('/mi-tarjeta');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Credenciales inválidas. Verifica tu usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E293B 100%)',
      position: 'relative',
      padding: '1.5rem',
      overflow: 'hidden'
    }}>
      {/* Glow ambiental tech */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.04) 50%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem 2.25rem',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(2, 6, 23, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#FFFFFF',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header con Logo Oficial NexoCard */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src={nexocardLogo} 
            alt="NexoCard" 
            style={{ maxWidth: '210px', height: 'auto', margin: '0 auto 0.75rem', display: 'block' }}
          />
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.2rem 0.65rem', 
            borderRadius: '9999px', 
            backgroundColor: 'var(--color-surface-soft)', 
            border: '1px solid var(--color-border)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            fontWeight: 600
          }}>
            <span>Comercio: Cafetería Premium</span>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            backgroundColor: 'var(--color-danger-100)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            color: 'var(--color-danger-600)',
            fontSize: '0.86rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Usuario o Correo</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                required
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.98rem' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} style={{ color: 'var(--color-cyan-500)' }} />
          <span>Plataforma SaaS segura de saldo y Gift Cards</span>
        </div>
      </div>
    </div>
  );
}
