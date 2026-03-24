import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Building2, MapPin, Moon, CreditCard,
  CalendarPlus, X,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth,
  isToday, parseISO, isBefore, isAfter, isSameDay,
  differenceInDays, addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking, BookingStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { ROUTES } from '../../../router/routes';

// ── Constants ────────────────────────────────────────────────────────────────
const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_H   = 36;   // px — height of the day-number row inside a week cell
const PILL_H  = 22;   // px — booking pill height
const PILL_G  = 3;    // px — gap between pill rows
const PILL_Y  = 4;    // px — padding from day-number row to first pill
const BOTTOM  = 6;    // px — padding below last pill row
const MAX_ROWS = 3;

const STATUS: Record<BookingStatus, { bar: string; dot: string; label: string }> = {
  confirmed: { bar: 'bg-primary text-white border-primary/40',           dot: 'bg-primary',      label: 'Confirmada' },
  pending:   { bar: 'bg-amber-400 text-white border-amber-300',          dot: 'bg-amber-400',    label: 'Pendente'   },
  completed: { bar: 'bg-emerald-500 text-white border-emerald-400',      dot: 'bg-emerald-500',  label: 'Concluída'  },
  cancelled: { bar: 'bg-rose-400 text-white border-rose-300',            dot: 'bg-rose-400',     label: 'Cancelada'  },
  no_show:   { bar: 'bg-neutral-400 text-white border-neutral-300',      dot: 'bg-neutral-400',  label: 'No-show'    },
};

// ── Types ────────────────────────────────────────────────────────────────────
interface PlacedBooking {
  booking: Booking;
  startCol: number;
  span: number;
  row: number;
  isStart: boolean;
  isEnd: boolean;
}

interface TooltipState {
  booking: Booking;
  top: number;
  left: number;
  above: boolean;
}

// ── Pure helpers ─────────────────────────────────────────────────────────────
function buildWeeks(month: Date): Date[][] {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end:   endOfWeek(endOfMonth(month),   { weekStartsOn: 0 }),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function placeBookings(week: Date[], bookings: Booking[]): PlacedBooking[] {
  const ws = week[0];
  const we = week[6];

  const visible = bookings
    .filter(b => !isAfter(parseISO(b.checkIn), we) && !isBefore(parseISO(b.checkOut), ws))
    .sort((a, b) => parseISO(a.checkIn).getTime() - parseISO(b.checkIn).getTime());

  const grid: boolean[][] = []; // grid[row][col]
  const result: PlacedBooking[] = [];

  for (const booking of visible) {
    const ci = parseISO(booking.checkIn);
    const co = parseISO(booking.checkOut);
    const vs = isBefore(ci, ws) ? ws : ci;
    const ve = isAfter(co, we)  ? we  : co;
    const sc = differenceInDays(vs, ws);
    const sp = differenceInDays(ve, vs) + 1;

    let row = 0;
    for (;;) {
      if (!grid[row]) grid[row] = Array(7).fill(false);
      if (grid[row].slice(sc, sc + sp).every(v => !v)) break;
      row++;
    }
    for (let c = sc; c < sc + sp; c++) grid[row][c] = true;

    result.push({
      booking, startCol: sc, span: sp, row,
      isStart: !isBefore(ci, ws),
      isEnd:   !isAfter(co, we),
    });
  }
  return result;
}

function weekHeight(placed: PlacedBooking[]): number {
  const maxRow = placed.reduce((m, p) => Math.max(m, p.row), -1);
  const visibleRows = Math.min(maxRow + 1, MAX_ROWS);
  return DAY_H + PILL_Y + visibleRows * (PILL_H + PILL_G) + BOTTOM;
}

// ── Main Component ───────────────────────────────────────────────────────────
interface CalendarViewProps {
  bookings: Booking[];
}

export function CalendarView({ bookings }: CalendarViewProps) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleDayClick = useCallback((day: Date) => {
    // Don't allow selecting past dates
    if (isBefore(day, new Date()) && !isToday(day)) return;

    if (!selectedCheckIn || selectedCheckOut) {
      // First click or reset: set check-in
      setSelectedCheckIn(day);
      setSelectedCheckOut(null);
    } else {
      // Second click: set check-out
      let ci = selectedCheckIn;
      let co = day;
      if (isBefore(co, ci)) { [ci, co] = [co, ci]; }
      if (isSameDay(ci, co)) { co = addDays(co, 1); }
      setSelectedCheckIn(ci);
      setSelectedCheckOut(co);
    }
  }, [selectedCheckIn, selectedCheckOut]);

  const handleBookFromCalendar = useCallback(() => {
    if (!selectedCheckIn) return;
    const ci = format(selectedCheckIn, 'yyyy-MM-dd');
    const co = selectedCheckOut ? format(selectedCheckOut, 'yyyy-MM-dd') : format(addDays(selectedCheckIn, 1), 'yyyy-MM-dd');
    navigate(`${ROUTES.DASHBOARD_BOOKINGS_NEW}?checkIn=${ci}&checkOut=${co}`);
  }, [selectedCheckIn, selectedCheckOut, navigate]);

  const clearSelection = useCallback(() => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
  }, []);

  const isDayInRange = useCallback((day: Date) => {
    if (!selectedCheckIn) return false;
    if (!selectedCheckOut) return isSameDay(day, selectedCheckIn);
    return (isSameDay(day, selectedCheckIn) || isAfter(day, selectedCheckIn)) &&
           (isSameDay(day, selectedCheckOut) || isBefore(day, selectedCheckOut));
  }, [selectedCheckIn, selectedCheckOut]);

  const isDayRangeStart = useCallback((day: Date) => selectedCheckIn ? isSameDay(day, selectedCheckIn) : false, [selectedCheckIn]);
  const isDayRangeEnd = useCallback((day: Date) => selectedCheckOut ? isSameDay(day, selectedCheckOut) : false, [selectedCheckOut]);

  const weeks = useMemo(() => buildWeeks(month), [month]);
  const weekData = useMemo(
    () => weeks.map(week => ({ week, placed: placeBookings(week, bookings) })),
    [weeks, bookings],
  );

  const stats = useMemo(() => {
    const ms = startOfMonth(month);
    const me = endOfMonth(month);
    const mb = bookings.filter(b => {
      const ci = parseISO(b.checkIn);
      return !isAfter(ci, me) && !isBefore(ci, ms);
    });
    const revenue = mb
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((s, b) => s + b.totalPrice, 0);
    return {
      total:     mb.length,
      confirmed: mb.filter(b => b.status === 'confirmed').length,
      pending:   mb.filter(b => b.status === 'pending').length,
      completed: mb.filter(b => b.status === 'completed').length,
      revenue,
    };
  }, [bookings, month]);

  function handlePillEnter(booking: Booking, e: React.MouseEvent<HTMLDivElement>) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const TOOLTIP_H = 240;
    const above = rect.top > TOOLTIP_H + 16;
    setTooltip({
      booking,
      top:   above ? rect.top  - TOOLTIP_H - 8 : rect.bottom + 8,
      left:  Math.max(12, Math.min(rect.left + rect.width / 2 - 150, window.innerWidth - 312)),
      above,
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Header bar ── */}
      <div className="card-base p-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-neutral-600"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-neutral-900 min-w-[190px] text-center capitalize">
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-neutral-600"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="ml-1 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-5 text-sm flex-wrap">
          <span className="text-neutral-400 text-xs hidden sm:inline">Este mês:</span>
          <Stat color="bg-neutral-400" label="Total" value={String(stats.total)} />
          <Stat color="bg-primary"     label="Confirmadas" value={String(stats.confirmed)} />
          <Stat color="bg-amber-400"   label="Pendentes"   value={String(stats.pending)} />
          <Stat color="bg-emerald-500" label="Concluídas"  value={String(stats.completed)} />
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-xs">Receita</span>
            <span className="font-bold text-primary text-sm">{formatCurrency(stats.revenue)}</span>
          </div>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div ref={calendarRef} className="card-base overflow-hidden relative">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-surface-border bg-surface-muted/70">
          {DAY_HEADERS.map(h => (
            <div key={h} className="py-2.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider select-none">
              {h}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weekData.map(({ week, placed }, wi) => {
          const h = weekHeight(placed);
          const visiblePlaced = placed.filter(p => p.row < MAX_ROWS);

          // Count pills hidden by MAX_ROWS overflow, per column
          const overflow: number[] = Array(7).fill(0);
          placed
            .filter(p => p.row >= MAX_ROWS)
            .forEach(p => {
              for (let c = p.startCol; c < p.startCol + p.span; c++) overflow[c]++;
            });

          return (
            <div
              key={wi}
              className="relative border-b border-surface-border last:border-0"
              style={{ height: `${h}px` }}
            >
              {/* Day-number cells */}
              <div className="absolute inset-0 grid grid-cols-7">
                {week.map((day, di) => {
                  const inMonth = isSameMonth(day, month);
                  const today   = isToday(day);
                  const inRange = isDayInRange(day);
                  const isStart = isDayRangeStart(day);
                  const isEnd   = isDayRangeEnd(day);
                  const isPast  = isBefore(day, new Date()) && !today;
                  return (
                    <div
                      key={di}
                      onClick={() => !isPast && inMonth && handleDayClick(day)}
                      className={cn(
                        'border-r border-surface-border last:border-0 px-1.5 pt-1.5 transition-colors',
                        !inMonth && 'bg-neutral-50/80',
                        today && !inRange && 'bg-primary/[0.03]',
                        inMonth && !isPast && 'cursor-pointer hover:bg-primary/5',
                        isPast && 'opacity-40 cursor-not-allowed',
                        inRange && !isStart && !isEnd && 'bg-primary/10',
                        isStart && 'bg-primary/20 rounded-l',
                        isEnd && 'bg-primary/20 rounded-r',
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium select-none',
                            isStart || isEnd
                              ? 'bg-primary text-white font-bold'
                              : today
                              ? 'bg-primary text-white font-bold'
                              : inMonth
                              ? 'text-neutral-700'
                              : 'text-neutral-300',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {overflow[di] > 0 && (
                          <span className="text-[10px] font-semibold text-neutral-400 leading-none mt-1 mr-0.5">
                            +{overflow[di]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Booking pills */}
              {visiblePlaced.map(pb => {
                const left  = (pb.startCol / 7) * 100;
                const width = (pb.span / 7) * 100;
                const top   = DAY_H + PILL_Y + pb.row * (PILL_H + PILL_G);
                const cfg   = STATUS[pb.booking.status as BookingStatus] ?? STATUS.no_show;

                return (
                  <div
                    key={`${pb.booking.id}-w${wi}`}
                    style={{
                      position: 'absolute',
                      left:   `calc(${left}% + 2px)`,
                      width:  `calc(${width}% - 4px)`,
                      top:    `${top}px`,
                      height: `${PILL_H}px`,
                    }}
                    className={cn(
                      'flex items-center text-xs font-medium px-2 select-none cursor-pointer',
                      'border transition-opacity hover:opacity-75 z-10 overflow-hidden',
                      cfg.bar,
                      pb.isStart ? 'rounded-l' : 'rounded-l-none border-l-0 pl-1',
                      pb.isEnd   ? 'rounded-r' : 'rounded-r-none border-r-0',
                    )}
                    onMouseEnter={e => handlePillEnter(pb.booking, e)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {pb.isStart ? (
                      <span className="truncate leading-none">{pb.booking.guestName}</span>
                    ) : pb.span >= 2 ? (
                      <span className="truncate leading-none opacity-75">↩ {pb.booking.guestName}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Selection indicator bar ── */}
      {selectedCheckIn && (
        <div className="card-base p-3 flex items-center justify-between gap-3 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 text-sm">
            <CalendarPlus className="w-4 h-4 text-primary" />
            <span className="text-neutral-700">
              <strong className="text-primary">{format(selectedCheckIn, 'dd/MM/yyyy')}</strong>
              {selectedCheckOut && (
                <> → <strong className="text-primary">{format(selectedCheckOut, 'dd/MM/yyyy')}</strong>
                  <span className="text-neutral-400 ml-2">
                    ({differenceInDays(selectedCheckOut, selectedCheckIn)} noite{differenceInDays(selectedCheckOut, selectedCheckIn) !== 1 ? 's' : ''})
                  </span>
                </>
              )}
              {!selectedCheckOut && (
                <span className="text-neutral-400 ml-2">← selecione o check-out</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
            {selectedCheckOut && (
              <Button size="sm" onClick={handleBookFromCalendar}>
                <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Reservar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 flex-wrap px-1">
        {(Object.entries(STATUS) as [BookingStatus, (typeof STATUS)[BookingStatus]][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={cn('w-3 h-3 rounded-sm inline-block', cfg.dot)} />
            {cfg.label}
          </div>
        ))}
        <span className="text-xs text-neutral-400 ml-auto hidden sm:block">
          Clique em um dia para selecionar check-in e check-out
        </span>
      </div>

      {/* ── Floating tooltip ── */}
      {tooltip && (
        <BookingTooltip
          booking={tooltip.booking}
          top={tooltip.top}
          left={tooltip.left}
          onMouseEnter={() => {/* keep open */}}
          onMouseLeave={() => setTooltip(null)}
        />
      )}
    </div>
  );
}

// ── Stat chip ────────────────────────────────────────────────────────────────
function Stat({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full inline-block flex-shrink-0', color)} />
      <span className="text-neutral-500 text-xs">{label}</span>
      <span className="font-semibold text-neutral-800 text-sm">{value}</span>
    </div>
  );
}

// ── Tooltip card ─────────────────────────────────────────────────────────────
interface BookingTooltipProps {
  booking: Booking;
  top: number;
  left: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function BookingTooltip({ booking, top, left, onMouseEnter, onMouseLeave }: BookingTooltipProps) {
  const cfg = STATUS[booking.status as BookingStatus] ?? STATUS.no_show;

  return (
    <div
      className="fixed z-50 w-72 pointer-events-none"
      style={{ top, left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        {/* Colored top strip */}
        <div className={cn('h-1.5 w-full', cfg.dot)} />

        <div className="p-4 space-y-3">
          {/* Guest + code */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-neutral-900 text-sm leading-tight truncate">
                {booking.guestName}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{booking.confirmationCode}</p>
            </div>
            <BookingStatusBadge status={booking.status as BookingStatus} />
          </div>

          {/* Property */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-neutral-700 font-medium truncate">{booking.propertyName}</span>
            </div>
            {booking.propertyCity && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                <span className="text-neutral-500">{booking.propertyCity}</span>
              </div>
            )}
          </div>

          {/* Dates grid */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-50 rounded-xl p-3 text-xs border border-surface-border">
            <div>
              <p className="text-neutral-400 mb-1 uppercase tracking-wider text-[10px] font-semibold">Check-in</p>
              <p className="font-bold text-neutral-800">{formatDate(booking.checkIn)}</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-1 uppercase tracking-wider text-[10px] font-semibold">Check-out</p>
              <p className="font-bold text-neutral-800">{formatDate(booking.checkOut)}</p>
            </div>
          </div>

          {/* Nights · Guests · Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Moon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {booking.nights} noite{booking.nights !== 1 ? 's' : ''} ·{' '}
                {booking.guests} hóspede{booking.guests !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="font-bold text-primary text-sm">{formatCurrency(booking.totalPrice)}</span>
            </div>
          </div>

          {booking.specialRequests && (
            <p className="text-xs text-neutral-500 italic border-t border-surface-border pt-2 line-clamp-2">
              "{booking.specialRequests}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
