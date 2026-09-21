import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ requireStaff = false, requireCashier = false }) {
  const { isAuthenticated, isStaff, isCashier, isCustomer } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireStaff && !isStaff) {
    // Si es cajero lo enviamos a terminal, si no al portal de cliente
    if (isCashier) return <Navigate to="/terminal" replace />;
    return <Navigate to="/mi-tarjeta" replace />;
  }

  if (requireCashier && !isCashier && !isStaff) {
    return <Navigate to="/mi-tarjeta" replace />;
  }

  return <Outlet />;
}
