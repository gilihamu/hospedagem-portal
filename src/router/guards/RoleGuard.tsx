import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import type { UserRole } from '../../types';
import { ROUTES } from '../routes';

interface RoleGuardProps {
  requiredRoles: UserRole[];
}

export function RoleGuard({ requiredRoles }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !requiredRoles.includes(user.role)) {
    if (user?.role === 'admin') return <Navigate to={ROUTES.ADMIN} replace />;
    if (user?.role === 'host') return <Navigate to={ROUTES.DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
