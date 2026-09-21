import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TerminalPage from './pages/TerminalPage';
import TarjetasPage from './pages/TarjetasPage';
import CorteCajaPage from './pages/CorteCajaPage';
import PerfilClientePage from './pages/PerfilClientePage';
import TransaccionesPage from './pages/TransaccionesPage';

// Smart Home redirect based on role
function HomeRoute() {
  const { isStaff, isCashier } = useAuth();
  if (isStaff) {
    return <DashboardPage />;
  }
  if (isCashier) {
    return <Navigate to="/terminal" replace />;
  }
  return <Navigate to="/mi-tarjeta" replace />;
}

// Layout con Sidebar Vertical para todas las pantallas autenticadas
function AppLayout() {
  return (
    <div className="app-shell">
      {/* 1. Sidebar Vertical Izquierda */}
      <Sidebar />

      {/* 2. Área de Contenido Principal */}
      <main className="main-content">
        <div className="content-container">
          <Routes>
            {/* Smart Root */}
            <Route path="/" element={<HomeRoute />} />

            {/* Gerencia / Admin Routes */}
            <Route element={<ProtectedRoute requireStaff={true} />}>
              <Route path="/tarjetas" element={<TarjetasPage />} />
              <Route path="/transacciones" element={<TransaccionesPage />} />
            </Route>

            {/* POS Terminal & Arqueo Routes (Cajeros & Staff) */}
            <Route element={<ProtectedRoute requireCashier={true} />}>
              <Route path="/terminal" element={<TerminalPage />} />
              <Route path="/corte-caja" element={<CorteCajaPage />} />
            </Route>

            {/* Customer Self-Service Route */}
            <Route path="/mi-tarjeta" element={<PerfilClientePage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected App Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
