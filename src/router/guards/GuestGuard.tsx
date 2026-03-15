import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { ROUTES } from '../routes';

export function GuestGuard() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to={ROUTES.ADMIN} replace />;
    if (user?.role === 'host') return <Navigate to={ROUTES.DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
