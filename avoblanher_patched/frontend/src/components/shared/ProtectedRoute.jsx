import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  // Si se especifican roles, verificar que el usuario tenga uno de ellos
  if (roles && !roles.includes(user.rol)) {
    // Los clientes van al portal, el resto al dashboard
    return <Navigate to={user.rol === 'cliente' ? '/portal' : '/dashboard'} replace />;
  }

  return children;
}
