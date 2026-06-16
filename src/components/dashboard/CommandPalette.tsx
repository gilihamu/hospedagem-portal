import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Calendar, Building2, GitBranch, BarChart3,
  Radio, CreditCard, Wallet, BookOpen, User, MessageSquare, Plus, Phone,
  ExternalLink, Search, CornerDownLeft, Sun, Moon, Rows3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { useOwnerProperties } from '../../hooks/useProperties';
import { useHostBookings } from '../../hooks/useBookings';
import { ROUTES, editPropertyRoute, bookingManageRoute, guestDetailRoute } from '../../router/routes';
import { cn } from '../../utils/cn';

interface Command {
  id: string;
  label: string;
  sub?: string;
  group: string;
  icon: LucideIcon;
  path?: string;
  action?: () => void;
  keywords?: string;
}

const COMMANDS: Command[] = [
  { id: 'overview', label: 'Visão Geral', group: 'Navegação', icon: LayoutDashboard, path: ROUTES.DASHBOARD, keywords: 'dashboard inicio home painel' },
  { id: 'bookings', label: 'Reservas', group: 'Navegação', icon: CalendarDays, path: ROUTES.DASHBOARD_BOOKINGS },
  { id: 'calendar', label: 'Calendário', group: 'Navegação', icon: Calendar, path: ROUTES.DASHBOARD_BOOKINGS_CALENDAR },
  { id: 'properties', label: 'Propriedades', group: 'Navegação', icon: Building2, path: ROUTES.DASHBOARD_PROPERTIES, keywords: 'acomodações imoveis' },
  { id: 'branches', label: 'Filiais', group: 'Navegação', icon: GitBranch, path: ROUTES.DASHBOARD_BRANCHES },
  { id: 'analytics', label: 'Analytics', group: 'Navegação', icon: BarChart3, path: ROUTES.DASHBOARD_ANALYTICS, keywords: 'relatorios desempenho metricas' },
  { id: 'channels', label: 'Canais', group: 'Navegação', icon: Radio, path: ROUTES.DASHBOARD_CHANNELS, keywords: 'booking airbnb channel manager' },
  { id: 'payments', label: 'Pagamentos', group: 'Navegação', icon: CreditCard, path: ROUTES.DASHBOARD_PAYMENTS },
  { id: 'finance', label: 'Finanças', group: 'Navegação', icon: Wallet, path: ROUTES.DASHBOARD_FINANCE, keywords: 'despesas fluxo de caixa' },
  { id: 'guests', label: 'Hóspedes', group: 'Navegação', icon: User, path: ROUTES.DASHBOARD_GUESTS },
  { id: 'guide', label: 'Guia do Hóspede', group: 'Navegação', icon: BookOpen, path: ROUTES.DASHBOARD_GUEST_GUIDE },
  { id: 'messages', label: 'Mensagens', group: 'Navegação', icon: MessageSquare, path: ROUTES.MESSAGES },
  { id: 'profile', label: 'Meu Perfil', group: 'Navegação', icon: User, path: ROUTES.DASHBOARD_PROFILE },
  { id: 'new-booking', label: 'Nova Reserva', group: 'Ações', icon: Phone, path: ROUTES.DASHBOARD_BOOKINGS_NEW },
  { id: 'new-property', label: 'Nova Propriedade', group: 'Ações', icon: Plus, path: ROUTES.DASHBOARD_PROPERTY_NEW },
  { id: 'portal', label: 'Ver portal público', group: 'Ações', icon: ExternalLink, path: ROUTES.HOME },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iP/.test(navigator.platform);

export function CommandPalette() {
  const commandOpen = useUIStore((s) => s.commandOpen);
  const openCommand = useUIStore((s) => s.openCommand);
  const closeCommand = useUIStore((s) => s.closeCommand);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const density = useUIStore((s) => s.density);
  const toggleDensity = useUIStore((s) => s.toggleDensity);
  const user = useAuthStore((s) => s.user);
  const { data: properties } = useOwnerProperties(user?.id);
  const { data: bookings } = useHostBookings(user?.id);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (useUIStore.getState().commandOpen) closeCommand();
        else openCommand();
      } else if (e.key === 'Escape' && useUIStore.getState().commandOpen) {
        closeCommand();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openCommand, closeCommand]);

  useEffect(() => {
    if (commandOpen) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [commandOpen]);

  const allCommands = useMemo<Command[]>(
    () => [
      ...COMMANDS,
      {
        id: 'theme',
        label: theme === 'dark' ? 'Tema claro' : 'Tema escuro',
        group: 'Preferências',
        icon: theme === 'dark' ? Sun : Moon,
        action: toggleTheme,
        keywords: 'dark mode escuro claro tema aparência',
      },
      {
        id: 'density',
        label: density === 'compact' ? 'Densidade confortável' : 'Densidade compacta',
        group: 'Preferências',
        icon: Rows3,
        action: toggleDensity,
        keywords: 'densidade compacto confortável espaçamento layout',
      },
    ],
    [theme, toggleTheme, density, toggleDensity]
  );

  const entityResults = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Command[] = [];
    (properties ?? [])
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((p) => out.push({ id: `prop-${p.id}`, label: p.name, sub: 'Propriedade', group: 'Propriedades', icon: Building2, path: editPropertyRoute(p.id) }));
    (bookings ?? [])
      .filter((b) => `${b.guestName} ${b.confirmationCode} ${b.propertyName}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((b) => out.push({ id: `book-${b.id}`, label: b.guestName, sub: `${b.confirmationCode} · ${b.propertyName}`, group: 'Reservas', icon: CalendarDays, path: bookingManageRoute(b.id) }));
    const seen = new Set<string>();
    (bookings ?? [])
      .filter((b) => b.guestName.toLowerCase().includes(q))
      .forEach((b) => {
        if (seen.has(b.guestId) || seen.size >= 4) return;
        seen.add(b.guestId);
        out.push({ id: `guest-${b.guestId}`, label: b.guestName, sub: 'Hóspede', group: 'Hóspedes', icon: User, path: guestDetailRoute(b.guestId) });
      });
    return out;
  }, [query, properties, bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    const matched = allCommands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
    return [...entityResults, ...matched];
  }, [query, allCommands, entityResults]);

  useEffect(() => { setActive(0); }, [query]);

  if (!commandOpen) return null;

  const run = (c?: Command) => {
    if (!c) return;
    closeCommand();
    if (c.action) c.action();
    else if (c.path) (navigate as NavigateFunction)(c.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(filtered[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); closeCommand(); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-neutral-900/40 backdrop-blur-sm animate-fade-in"
      onClick={closeCommand}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-card-hover border border-surface-border overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Paleta de comandos"
      >
        <div className="flex items-center gap-3 px-4 border-b border-surface-border">
          <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas e ações..."
            className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder-neutral-400"
          />
          <kbd className="text-[10px] text-neutral-400 border border-surface-border rounded px-1.5 py-0.5">esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Nada encontrado para "{query}"</p>
          ) : (
            <div className="px-2">
              {filtered.map((c, i) => {
                const showHeader = i === 0 || filtered[i - 1].group !== c.group;
                const isActive = i === active;
                return (
                  <div key={c.id}>
                    {showHeader && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 px-2 pt-2 pb-1">{c.group}</p>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => run(c)}
                      className={cn(
                        'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-left transition-colors',
                        isActive ? 'bg-primary/10 text-primary' : 'text-neutral-700 hover:bg-surface-muted'
                      )}
                    >
                      <c.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : 'text-neutral-400')} />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{c.label}</span>
                        {c.sub && <span className="block text-xs text-neutral-400 truncate">{c.sub}</span>}
                      </span>
                      {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-border bg-surface-muted/40 text-[11px] text-neutral-400">
          <span>↑↓ navegar · ↵ abrir</span>
          <span className="tabular-nums">{isMac ? '⌘' : 'Ctrl'} K</span>
        </div>
      </div>
    </div>
  );
}
