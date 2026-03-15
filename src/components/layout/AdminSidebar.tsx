import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  Building,
  CalendarDays,
  FileBarChart,
  LogOut,
  X,
  Shield,
  Link2,
  Landmark,
  ScrollText,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { authService } from '../../services/auth.service';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../router/routes';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Visão Geral', icon: LayoutDashboard, href: ROUTES.ADMIN },
  { label: 'Usuários', icon: Users, href: ROUTES.ADMIN_USERS },
  { label: 'Propriedades', icon: Building, href: ROUTES.ADMIN_PROPERTIES },
  { label: 'Reservas', icon: CalendarDays, href: ROUTES.ADMIN_BOOKINGS },
  { label: 'Canais', icon: Link2, href: ROUTES.ADMIN_CHANNELS },
  { label: 'Relatórios', icon: FileBarChart, href: ROUTES.ADMIN_REPORTS },
  { label: 'Tenants', icon: Landmark, href: ROUTES.ADMIN_TENANTS },
  { label: 'Audit Logs', icon: ScrollText, href: ROUTES.ADMIN_AUDIT_LOGS },
  { label: 'Métricas', icon: Activity, href: ROUTES.ADMIN_METRICS },
];

export function AdminSidebar() {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    logout();
    navigate(ROUTES.HOME);
  };

  const isActive = (href: string) => {
    if (href === ROUTES.ADMIN) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const sidebar = (
    <aside className="w-64 h-full bg-primary-dark flex flex-col">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white block">HospedaBR</span>
            <span className="text-xs text-white/50">Admin</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-lg text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Portal link */}
      <div className="px-4 pb-2">
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Ver portal público
        </Link>
      </div>

      {/* User info */}
      {user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex flex-shrink-0">{sidebar}</div>
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative">{sidebar}</div>
        </div>
      )}
    </>
  );
}
