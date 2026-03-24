import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Building2, Users } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, isSameDay, isWithinInterval, differenceInDays, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';
import type { Booking } from '../../types';

interface BookingGridProps {
  bookings: Booking[];
  properties: { id: string; name: string }[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  confirmed: { bg: 'bg-primary/90', text: 'text-white', border: 'border-primary' },
  pending: { bg: 'bg-amber-400/90', text: 'text-white', border: 'border-amber-500' },
  completed: { bg: 'bg-emerald-500/90', text: 'text-white', border: 'border-emerald-600' },
  no_show: { bg: 'bg-neutral-400/80', text: 'text-white', border: 'border-neutral-500' },
  cancelled: { bg: 'bg-red-400/60', text: 'text-white line-through', border: 'border-red-400' },
};

const DAYS_OPTIONS = [7, 14, 30];

export function BookingGrid({ bookings, properties }: BookingGridProps) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [numDays, setNumDays] = useState(7);
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null);
  const [tooltipBooking, setTooltipBooking] = useState<Booking | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() =>
    Array.from({ length: numDays }, (_, i) => addDays(startDate, i)),
    [startDate, numDays]
  );

  const activeBookings = useMemo(() =>
    bookings.filter(b => b.status !== 'cancelled'),
    [bookings]
  );

  // Count bookings per day (for the summary row)
  const dailyCounts = useMemo(() => {
    return days.map(day => {
      const count = activeBookings.filter(b => {
        const ci = parseISO(b.checkIn);
        const co = parseISO(b.checkOut);
        return isWithinInterval(day, { start: ci, end: subDays(co, 1) }) || isSameDay(day, ci);
      }).length;
      return count;
    });
  }, [days, activeBookings]);

  // Get bookings for a specific property within the visible range
  const getPropertyBookings = (propertyId: string) => {
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];
    return bookings.filter(b => {
      if (b.propertyId !== propertyId) return false;
      const ci = parseISO(b.checkIn);
      const co = parseISO(b.checkOut);
      return ci <= rangeEnd && co > rangeStart;
    });
  };

  // Calculate span position for a booking within the grid
  const getBookingSpan = (booking: Booking) => {
    const ci = parseISO(booking.checkIn);
    const co = parseISO(booking.checkOut);
    const rangeStart = days[0];
    const rangeEnd = addDays(days[days.length - 1], 1);

    const visibleStart = ci < rangeStart ? rangeStart : ci;
    const visibleEnd = co > rangeEnd ? rangeEnd : co;

    const startCol = Math.max(0, differenceInDays(visibleStart, rangeStart));
    const span = Math.max(1, differenceInDays(visibleEnd, visibleStart));

    const startsBeforeRange = ci < rangeStart;
    const endsAfterRange = co > rangeEnd;

    return { startCol, span, startsBeforeRange, endsAfterRange };
  };

  const navigateGrid = (dir: number) => {
    setStartDate(d => addDays(d, dir * numDays));
  };

  const goToToday = () => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleBookingHover = (booking: Booking, e: React.MouseEvent) => {
    setHoveredBooking(booking.id);
    setTooltipBooking(booking);
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
      });
    }
  };

  // Scroll horizontally on mobile
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Property name column width
  const propColClass = 'w-[140px] sm:w-[180px] flex-shrink-0';
  const dayCellClass = numDays <= 7
    ? 'min-w-[100px] sm:min-w-[120px]'
    : numDays <= 14
    ? 'min-w-[80px] sm:min-w-[100px]'
    : 'min-w-[50px] sm:min-w-[70px]';

  return (
    <div className="card-base overflow-hidden" ref={gridRef}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-surface-border bg-surface-muted/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-neutral-800 text-sm sm:text-base">Mapa de Reservas</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Days toggle */}
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setNumDays(d)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  numDays === d
                    ? 'bg-primary text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Navigation */}
          <button onClick={() => navigateGrid(-1)} className="p-1.5 rounded-lg border border-surface-border hover:bg-neutral-50">
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </button>
          <button onClick={goToToday} className="px-2 py-1 text-xs font-medium rounded-lg border border-surface-border hover:bg-neutral-50 text-neutral-600">
            Hoje
          </button>
          <button onClick={() => navigateGrid(1)} className="p-1.5 rounded-lg border border-surface-border hover:bg-neutral-50">
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <div className="inline-flex flex-col min-w-full">
          {/* Day headers */}
          <div className="flex border-b border-surface-border bg-neutral-50 sticky top-0 z-10">
            <div className={`${propColClass} px-3 py-2 border-r border-surface-border flex items-center gap-1`}>
              <Building2 className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase">Propriedade</span>
            </div>
            {days.map((day, i) => {
              const today = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={i}
                  className={`${dayCellClass} flex-1 px-1 py-2 text-center border-r border-surface-border last:border-r-0 ${
                    today ? 'bg-primary/5' : isWeekend ? 'bg-neutral-100/50' : ''
                  }`}
                >
                  <div className={`text-[10px] font-medium uppercase ${today ? 'text-primary' : 'text-neutral-400'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-sm font-bold ${today ? 'text-primary' : 'text-neutral-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className={`text-[10px] ${today ? 'text-primary/70' : 'text-neutral-400'}`}>
                    {format(day, 'MMM', { locale: ptBR })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="flex border-b-2 border-surface-border bg-neutral-50/80">
            <div className={`${propColClass} px-3 py-1.5 border-r border-surface-border flex items-center gap-1`}>
              <Users className="w-3 h-3 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500">Ocupação</span>
            </div>
            {dailyCounts.map((count, i) => {
              const today = isToday(days[i]);
              return (
                <div
                  key={i}
                  className={`${dayCellClass} flex-1 flex items-center justify-center border-r border-surface-border last:border-r-0 py-1.5 ${
                    today ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    count === 0 ? 'text-neutral-300' :
                    count >= properties.length ? 'text-error' :
                    count > 0 ? 'text-primary' : 'text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Property rows */}
          {properties.map((property) => {
            const propBookings = getPropertyBookings(property.id);

            return (
              <div key={property.id} className="flex border-b border-surface-border hover:bg-neutral-50/50 transition-colors relative group">
                {/* Property name */}
                <div className={`${propColClass} px-3 py-3 border-r border-surface-border flex items-center gap-2 bg-white group-hover:bg-neutral-50 transition-colors sticky left-0 z-[5]`}>
                  <div className="w-2 h-2 rounded-full bg-primary/30 flex-shrink-0" />
                  <span className="text-xs font-medium text-neutral-700 truncate" title={property.name}>
                    {property.name}
                  </span>
                </div>

                {/* Day cells (background grid) */}
                <div className="flex flex-1 relative">
                  {days.map((day, i) => {
                    const today = isToday(day);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={i}
                        className={`${dayCellClass} flex-1 border-r border-surface-border last:border-r-0 ${
                          today ? 'bg-primary/[0.03]' : isWeekend ? 'bg-neutral-50/50' : ''
                        }`}
                        style={{ minHeight: '44px' }}
                      />
                    );
                  })}

                  {/* Booking bars (absolute positioned over grid) */}
                  {propBookings.map((booking) => {
                    const { startCol, span, startsBeforeRange, endsAfterRange } = getBookingSpan(booking);
                    const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.confirmed;
                    const isHovered = hoveredBooking === booking.id;

                    // Calculate position as percentage
                    const leftPct = (startCol / numDays) * 100;
                    const widthPct = (span / numDays) * 100;

                    return (
                      <div
                        key={booking.id}
                        className={`absolute top-1 bottom-1 ${colors.bg} ${colors.text} border ${colors.border}
                          flex items-center px-2 cursor-pointer transition-all duration-150
                          ${startsBeforeRange ? 'rounded-r-full' : 'rounded-full'}
                          ${endsAfterRange ? 'rounded-l-full rounded-r-none' : ''}
                          ${startsBeforeRange && endsAfterRange ? 'rounded-none' : ''}
                          ${isHovered ? 'shadow-lg scale-[1.02] z-20' : 'z-10 hover:shadow-md'}
                        `}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        onClick={() => navigate(`/dashboard/bookings/${booking.id}/manage`)}
                        onMouseEnter={(e) => handleBookingHover(booking, e)}
                        onMouseLeave={() => { setHoveredBooking(null); setTooltipBooking(null); }}
                        title={`${booking.guestName} — ${formatCurrency(booking.totalPrice)}`}
                      >
                        <div className="flex items-center gap-1 min-w-0 overflow-hidden w-full">
                          <span className="text-[11px] font-semibold truncate whitespace-nowrap">
                            {booking.guestName.split(' ').slice(0, 2).join(' ')}
                          </span>
                          {span >= 2 && numDays <= 14 && (
                            <span className="text-[10px] opacity-80 flex-shrink-0 hidden sm:inline">
                              {formatCurrency(booking.totalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {properties.length === 0 && (
            <div className="px-8 py-12 text-center">
              <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Nenhuma propriedade cadastrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltipBooking && (
        <div
          className="absolute z-50 bg-white rounded-xl shadow-xl border border-surface-border p-3 pointer-events-none w-[240px]"
          style={{
            left: Math.min(tooltipPos.x, (gridRef.current?.offsetWidth || 400) - 260),
            top: tooltipPos.y - 120,
          }}
        >
          <p className="font-semibold text-sm text-neutral-800 truncate">{tooltipBooking.guestName}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{tooltipBooking.propertyName}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs">
            <div>
              <span className="text-neutral-400">Check-in</span>
              <p className="font-medium text-neutral-700">{format(parseISO(tooltipBooking.checkIn), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <span className="text-neutral-400">Check-out</span>
              <p className="font-medium text-neutral-700">{format(parseISO(tooltipBooking.checkOut), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <span className="text-neutral-400">Noites</span>
              <p className="font-medium text-neutral-700">{tooltipBooking.nights}</p>
            </div>
            <div>
              <span className="text-neutral-400">Total</span>
              <p className="font-bold text-primary">{formatCurrency(tooltipBooking.totalPrice)}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[tooltipBooking.status]?.bg || 'bg-neutral-300'}`} />
            <span className="text-[10px] text-neutral-500 capitalize">{tooltipBooking.status === 'confirmed' ? 'Confirmada' : tooltipBooking.status === 'pending' ? 'Pendente' : tooltipBooking.status === 'completed' ? 'Concluída' : tooltipBooking.status}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 border-t border-surface-border bg-surface-muted/50">
        <div className="flex items-center gap-3">
          {[
            { label: 'Confirmada', color: 'bg-primary/90' },
            { label: 'Pendente', color: 'bg-amber-400/90' },
            { label: 'Concluída', color: 'bg-emerald-500/90' },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-neutral-500">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} /> {label}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-neutral-400">
          {activeBookings.length} reserva(s) ativa(s) · {properties.length} propriedade(s)
        </span>
      </div>
    </div>
  );
}
