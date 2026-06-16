import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, PlaneLanding, PlaneTakeoff, Clock, CheckCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useHostBookings } from '../../hooks/useBookings';
import { getTodayOps } from '../../utils/hotelMetrics';
import { ROUTES } from '../../router/routes';
import { cn } from '../../utils/cn';

interface NotificationItem {
  icon: LucideIcon;
  tone: string;
  text: string;
  to: string;
}

const plural = (n: number) => (n > 1 ? 's' : '');

export function NotificationCenter() {
  const { user } = useAuthStore();
  const { data: bookings } = useHostBookings(user?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ops = getTodayOps(bookings);

  const items: NotificationItem[] = [];
  if (ops.pending > 0) {
    items.push({ icon: Clock, tone: 'text-warning', text: `${ops.pending} reserva${plural(ops.pending)} pendente${plural(ops.pending)} de confirmação`, to: ROUTES.DASHBOARD_BOOKINGS });
  }
  if (ops.checkInsToday > 0) {
    items.push({ icon: PlaneLanding, tone: 'text-success', text: `${ops.checkInsToday} check-in${plural(ops.checkInsToday)} previsto${plural(ops.checkInsToday)} para hoje`, to: ROUTES.DASHBOARD_BOOKINGS });
  }
  if (ops.checkOutsToday > 0) {
    items.push({ icon: PlaneTakeoff, tone: 'text-info', text: `${ops.checkOutsToday} check-out${plural(ops.checkOutsToday)} previsto${plural(ops.checkOutsToday)} para hoje`, to: ROUTES.DASHBOARD_BOOKINGS });
  }
  const count = items.length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-neutral-500 hover:text-primary hover:bg-primary/5 transition-colors"
        aria-label={`Notificações${count ? ` (${count})` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-card-hover border border-surface-border overflow-hidden z-50 animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
            <h3 className="text-sm font-semibold text-neutral-800">Notificações</h3>
            {count > 0 && <span className="text-xs text-neutral-400">{count} nova{plural(count)}</span>}
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCheck className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">Tudo em dia!</p>
              <p className="text-xs text-neutral-400">Sem notificações novas</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {items.map((it, i) => (
                <Link
                  key={i}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <it.icon className={cn('w-4 h-4', it.tone)} />
                  </div>
                  <p className="text-sm text-neutral-700 leading-snug">{it.text}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
