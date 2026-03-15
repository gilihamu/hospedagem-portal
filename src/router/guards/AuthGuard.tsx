import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ROUTES } from '../routes';
import { useEffect } from 'react';

export function AuthGuard() {
  const { isAuthenticated, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
