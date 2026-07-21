import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const PortalAuthContext = createContext(null);

export function PortalAuthProvider({ children }) {
  return (
    <PortalAuthContext.Provider value={{}}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export const usePortalAuth = () => {
  const auth = useAuth();
  return {
    // cliente es el user si tiene rol cliente (o cualquier rol autenticado en portal)
    cliente: auth.user || null,
    login:   auth.login,
    logout:  auth.logout,
    loading: auth.loading,
  };
};
