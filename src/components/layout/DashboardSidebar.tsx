import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Building,
  GitBranch,
  Calendar,
  CalendarDays,
  LayoutList,
  BarChart3,
  MessageSquare,
  User,
  Users,
  LogOut,
  X,
  ChevronDown,
  BookOpen,
  Link2,
  Rocket,
  CreditCard,
  DollarSign,
  Receipt,
  ArrowDownUp,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { authService } from '../../services/auth.service';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../router/routes';
import { useNavigate } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────────────
interface SubNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  children?: SubNavItem[];
}

// ── Nav config ───────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: 'Visão Geral',  icon: LayoutDashboard, href: ROUTES.DASHBOARD },
  { label: 'Config. Inicial', icon: Rocket,      href: ROUTES.DASHBOARD_ONBOARDING },
  { label: 'Canais',       icon: Link2,          href: ROUTES.DASHBOARD_CHANNELS },
  { label: 'Propriedades', icon: Building,        href: ROUTES.DASHBOARD_PROPERTIES },
  { label: 'Filiais',      icon: GitBranch,       href: ROUTES.DASHBOARD_BRANCHES },
  {
    label: 'Reservas',
    icon: Calendar,
    href: ROUTES.DASHBOARD_BOOKINGS,
    children: [
      { label: 'Lista',       icon: LayoutList,   href: ROUTES.DASHBOARD_BOOKINGS },
      { label: 'Calendário',  icon: CalendarDays, href: ROUTES.DASHBOARD_BOOKINGS_CALENDAR },
      { label: 'Importar',     icon: FileSpreadsheet, href: ROUTES.DASHBOARD_IMPORT_BOOKING },
    ],
  },
  { label: 'Pagamentos',      icon: CreditCard,  href: ROUTES.DASHBOARD_PAYMENTS },
  { label: 'Hóspedes',        icon: Users,       href: ROUTES.DASHBOARD_GUESTS },
  { label: 'Guia do Hóspede', icon: BookOpen,    href: ROUTES.DASHBOARD_GUEST_GUIDE },
  {
    label: 'Financeiro',
    icon: DollarSign,
    href: ROUTES.DASHBOARD_FINANCE,
    children: [
      { label: 'Dashboard', icon: BarChart3, href: ROUTES.DASHBOARD_FINANCE },
      { label: 'Despesas', icon: Receipt, href: ROUTES.DASHBOARD_FINANCE_EXPENSES },
      { label: 'Fluxo de Caixa', icon: ArrowDownUp, href: ROUTES.DASHBOARD_FINANCE_CASHFLOW },
      { label: 'Relatórios', icon: FileText, href: ROUTES.DASHBOARD_FINANCE_REPORTS },
    ],
  },
  { label: 'Analytics',   icon: BarChart3,       href: ROUTES.DASHBOARD_ANALYTICS },
  { label: 'Mensagens',   icon: MessageSquare,   href: ROUTES.MESSAGES },
  { label: 'Perfil',      icon: User,            href: ROUTES.DASHBOARD_PROFILE },
];

// ── Component ────────────────────────────────────────────────────────────────
export function DashboardSidebar() {
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
    if (href === ROUTES.DASHBOARD) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  // A parent item is "active" if any of its children paths match
  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(c => location.pathname === c.href || location.pathname.startsWith(c.href + '/'));
    }
    return isActive(item.href);
  };

  const sidebar = (
    <aside className="w-64 h-full bg-white border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-surface-border flex-shrink-0">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-primary">HospedaBR</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const parentActive = isParentActive(item);
            const hasChildren  = !!item.children?.length;
            // Expand sub-menu automatically when any child route is active
            const expanded     = hasChildren && parentActive;

            return (
              <li key={item.href}>
                {/* Parent link */}
                <Link
                  to={item.href}
                  onClick={() => !hasChildren && setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-l-2',
                    parentActive
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-800',
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                        expanded && 'rotate-180',
                      )}
                    />
                  )}
                </Link>

                {/* Sub-items */}
                {hasChildren && expanded && (
                  <ul className="mt-1 ml-4 pl-3 border-l-2 border-primary/20 space-y-0.5">
                    {item.children!.map((child) => {
                      // Exact match for list, prefix match for calendar
                      const childActive =
                        child.href === ROUTES.DASHBOARD_BOOKINGS
                          ? location.pathname === child.href
                          : location.pathname.startsWith(child.href);

                      return (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                              childActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
                            )}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      {user && (
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-800 truncate">{user.name}</p>
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-500 hover:text-error hover:bg-error-light rounded-lg transition-colors"
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
      {/* Desktop */}
      <div className="hidden lg:flex flex-shrink-0">{sidebar}</div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative">{sidebar}</div>
        </div>
      )}
    </>
  );
}
