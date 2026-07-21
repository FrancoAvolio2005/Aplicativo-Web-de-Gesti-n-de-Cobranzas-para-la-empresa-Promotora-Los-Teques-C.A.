import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/admin/DashboardPage';
import ClientsPage    from './pages/admin/ClientsPage';
import InvoicesPage   from './pages/admin/InvoicesPage';
import PaymentsPage   from './pages/admin/PaymentsPage';
import RiskPage       from './pages/admin/RiskPage';
import BotPage        from './pages/admin/BotPage';
import PortalDashboard from './pages/portal/PortalDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/"          element={<LandingPage />} />

            {/* Autenticación */}
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/registro"  element={<RegisterPage />} />
            <Route path="/portal/login" element={<LoginPage />} />

            {/* Panel admin */}
            <Route path="/dashboard" element={<ProtectedRoute roles={['admin','supervisor','operador']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/clients"   element={<ProtectedRoute roles={['admin','supervisor','operador']}><ClientsPage /></ProtectedRoute>} />
            <Route path="/invoices"  element={<ProtectedRoute roles={['admin','supervisor','operador']}><InvoicesPage /></ProtectedRoute>} />
            <Route path="/payments"  element={<ProtectedRoute roles={['admin','supervisor','operador']}><PaymentsPage /></ProtectedRoute>} />
            <Route path="/risk"      element={<ProtectedRoute roles={['admin','supervisor','operador']}><RiskPage /></ProtectedRoute>} />
            <Route path="/bot"       element={<ProtectedRoute roles={['admin']}><BotPage /></ProtectedRoute>} />

            {/* Portal cliente — 3 rutas: Inicio, Deudas Pendientes, Mis Pagos */}
            <Route path="/portal"            element={<ProtectedRoute><PortalDashboard /></ProtectedRoute>} />
            <Route path="/portal/pendientes" element={<ProtectedRoute><PortalDashboard /></ProtectedRoute>} />
            <Route path="/portal/pagos"      element={<ProtectedRoute><PortalDashboard /></ProtectedRoute>} />

            {/* Rutas antiguas — redirección para compatibilidad */}
            <Route path="/portal/notificar"  element={<Navigate to="/portal" replace />} />
            <Route path="/portal/avisos"     element={<Navigate to="/portal/pendientes" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
