import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Building2, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { propertyCalendarRoute } from '../../router/routes';
import { api } from '../../lib/api';

interface PropertyBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

interface Props {
  propertyId: string;
  propertyName: string;
}

const DAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function buildWeeks(month: Date): Date[][] {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export function PropertyCalendarCard({ propertyId, propertyName }: Props) {
  const [month, setMonth] = useState(new Date());
  const [bookings, setBookings] = useState<PropertyBooking[]>([]);

  useEffect(() => {
    const from = format(startOfMonth(month), 'yyyy-MM-dd');
    const to = format(endOfMonth(month), 'yyyy-MM-dd');
    api.get<PropertyBooking[]>(`/bookings/calendar/${propertyId}?from=${from}&to=${to}`)
      .then(setBookings)
      .catch(() => setBookings([]));
  }, [propertyId, month]);

  const weeks = useMemo(() => buildWeeks(month), [month]);

  const { bookedDays, checkInDays, checkOutDays } = useMemo(() => {
    const booked = new Set<string>();
    const ciSet = new Set<string>();
    const coSet = new Set<string>();
    bookings.forEach(b => {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      ciSet.add(format(ci, 'yyyy-MM-dd'));
      coSet.add(format(co, 'yyyy-MM-dd'));
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        booked.add(format(d, 'yyyy-MM-dd'));
      }
    });
    return { bookedDays: booked, checkInDays: ciSet, checkOutDays: coSet };
  }, [bookings]);

  return (
    <div className="card-base overflow-hidden">
      {/* Property header */}
      <Link
        to={propertyCalendarRoute(propertyId)}
        className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-semibold text-sm text-neutral-800 truncate">{propertyName}</span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary flex-shrink-0" />
      </Link>

      {/* Month nav */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border">
        <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-1 rounded hover:bg-surface-muted">
          <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />
        </button>
        <span className="text-xs font-semibold text-neutral-700 capitalize">
          {format(month, 'MMM yyyy', { locale: ptBR })}
        </span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1 rounded hover:bg-surface-muted">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Mini calendar */}
      <div className="p-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((h, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-neutral-400 select-none">
              {h}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const inMonth = isSameMonth(day, month);
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasBooking = bookedDays.has(dateStr);
              const isCheckIn = checkInDays.has(dateStr);
              const isCheckOut = checkOutDays.has(dateStr);
              const today = isToday(day);

              return (
                <Link
                  key={di}
                  to={propertyCalendarRoute(propertyId)}
                  className={cn(
                    'flex items-center justify-center w-full aspect-square text-[11px] rounded-sm transition-colors',
                    !inMonth && 'opacity-20',
                    inMonth && !hasBooking && 'text-neutral-600 hover:bg-neutral-100',
                    inMonth && hasBooking && !isCheckIn && !isCheckOut && 'bg-sky-100 text-sky-800 font-medium',
                    inMonth && isCheckIn && 'bg-emerald-100 text-emerald-800 font-bold',
                    inMonth && isCheckOut && 'bg-amber-100 text-amber-800 font-bold',
                    today && !hasBooking && 'ring-1 ring-primary font-bold text-primary',
                    today && hasBooking && 'ring-1 ring-primary',
                  )}
                  title={
                    isCheckIn ? 'Check-in' :
                    isCheckOut ? 'Check-out' :
                    hasBooking ? 'Reservado' :
                    today ? 'Hoje' : undefined
                  }
                >
                  {format(day, 'd')}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 px-3 py-1.5 border-t border-surface-border bg-surface-muted/50">
        <span className="flex items-center gap-1 text-[9px] text-neutral-500">
          <span className="w-2 h-2 rounded-sm bg-emerald-100 border border-emerald-300" /> In
        </span>
        <span className="flex items-center gap-1 text-[9px] text-neutral-500">
          <span className="w-2 h-2 rounded-sm bg-sky-100 border border-sky-300" /> Ocupado
        </span>
        <span className="flex items-center gap-1 text-[9px] text-neutral-500">
          <span className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-300" /> Out
        </span>
      </div>
    </div>
  );
}
