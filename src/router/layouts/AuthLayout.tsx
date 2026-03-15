import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { ROUTES } from '../routes';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <span className="font-bold text-2xl text-white">HospedaBR</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <Outlet />
      </div>

      <p className="mt-6 text-xs text-white/40">
        © {new Date().getFullYear()} HospedaBR. Todos os direitos reservados.
      </p>
    </div>
  );
}
