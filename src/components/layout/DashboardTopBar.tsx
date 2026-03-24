import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, ExternalLink, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { Avatar } from '../ui/Avatar';
import { ROUTES } from '../../router/routes';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Visão Geral',
  '/dashboard/onboarding': 'Config. Inicial',
  '/dashboard/channels': 'Canais',
  '/dashboard/properties': 'Propriedades',
  '/dashboard/properties/new': 'Nova Acomodação',
  '/dashboard/branches': 'Filiais',
  '/dashboard/branches/new': 'Nova Filial',
  '/dashboard/bookings': 'Reservas',
  '/dashboard/bookings/calendar': 'Calendário',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/payments': 'Pagamentos',
  '/dashboard/guest-guide': 'Guia do Hóspede',
  '/dashboard/profile': 'Meu Perfil',
  '/admin': 'Visão Geral',
  '/admin/users': 'Usuários',
  '/admin/properties': 'Propriedades',
  '/admin/bookings': 'Reservas',
  '/admin/channels': 'Canais',
  '/admin/reports': 'Relatórios',
  '/admin/tenants': 'Tenants',
  '/admin/audit-logs': 'Logs de Auditoria',
  '/admin/metrics': 'Métricas do Sistema',
  '/admin/email-settings': 'Configurações de E-mail',
  '/messages': 'Mensagens',
};

export function DashboardTopBar() {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const location = useLocation();

  const pageTitle = routeLabels[location.pathname] || 'Painel';

  // Breadcrumb
  const parts = location.pathname.split('/').filter(Boolean);
  const crumbs = parts.map((part, idx) => {
    const path = '/' + parts.slice(0, idx + 1).join('/');
    return { label: routeLabels[path] || part, path };
  });

  return (
    <header className="h-16 bg-white border-b border-surface-border flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.length > 1 ? (
          <>
            {crumbs.slice(0, -1).map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5 text-neutral-400">
                <Link to={crumb.path} className="hover:text-neutral-600 transition-colors truncate max-w-24">
                  {crumb.label}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              </span>
            ))}
            <span className="font-semibold text-neutral-800 truncate">{pageTitle}</span>
          </>
        ) : (
          <h1 className="font-semibold text-neutral-800 text-base">{pageTitle}</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.HOME}
          className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver portal
        </Link>

        <Link
          to={ROUTES.MESSAGES}
          className="p-2 rounded-lg text-neutral-500 hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {user && (
          <Link to={ROUTES.DASHBOARD_PROFILE}>
            <Avatar src={user.avatar} name={user.name} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}
