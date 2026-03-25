import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Building2, Users, DollarSign, Lock, PlusCircle, Clock, FileText, Unlock, X, Check, Loader2 } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, isSameDay, isWithinInterval, differenceInDays, parseISO, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import type { Booking, ChannelSlug } from '../../types';

interface BookingGridProps {
  bookings: Booking[];
  properties: { id: string; name: string; pricePerNight?: number }[];
}

interface CalendarDayData {
  date: string;
  priceOverride: number | null;
  isBlocked: boolean;
  blockReason: string | null;
  minStay: number | null;
  note: string | null;
}

interface DayAction {
  propertyId: string;
  propertyName: string;
  dates: Date[];
  x: number;
  y: number;
}

interface SelectionState {
  propertyId: string;
  propertyName: string;
  dates: Date[];
}

type ModalType = 'price' | 'min_stay' | 'note' | null;

const CHANNEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  booking_com: { label: 'Booking.com', color: '#003580', icon: 'B' },
  airbnb:      { label: 'Airbnb',      color: '#FF5A5F', icon: 'A' },
  vrbo:        { label: 'Vrbo',        color: '#3F51B5', icon: 'V' },
  expedia:     { label: 'Expedia',     color: '#FFCC00', icon: 'E' },
  tripadvisor: { label: 'TripAdvisor', color: '#00AF87', icon: 'T' },
  decolar:     { label: 'Decolar',     color: '#FF6600', icon: 'D' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  confirmed: { bg: 'bg-blue-600',     text: 'text-white', border: 'border-blue-700',    label: 'Confirmada' },
  pending:   { bg: 'bg-amber-500',    text: 'text-white', border: 'border-amber-600',   label: 'Pendente' },
  completed: { bg: 'bg-emerald-600',  text: 'text-white', border: 'border-emerald-700', label: 'Concluida' },
  no_show:   { bg: 'bg-slate-500',    text: 'text-white', border: 'border-slate-600',   label: 'No-show' },
  cancelled: { bg: 'bg-red-400',      text: 'text-white line-through opacity-60', border: 'border-red-500', label: 'Cancelada' },
};

const DAYS_OPTIONS = [7, 14, 30];

const DAY_ACTIONS = [
  { id: 'create',   label: 'Criar reserva',     icon: PlusCircle, color: 'text-neutral-700', bg: 'hover:bg-neutral-50' },
  { id: 'price',    label: 'Alterar preco',      icon: DollarSign, color: 'text-emerald-600', bg: 'hover:bg-emerald-50' },
  { id: 'block',    label: 'Bloquear datas',     icon: Lock,       color: 'text-red-500',     bg: 'hover:bg-red-50' },
  { id: 'unblock',  label: 'Desbloquear datas',  icon: Unlock,     color: 'text-neutral-500', bg: 'hover:bg-neutral-50' },
  { id: 'min_stay', label: 'Estadia minima',     icon: Clock,      color: 'text-amber-600',   bg: 'hover:bg-amber-50' },
  { id: 'note',     label: 'Adicionar nota',     icon: FileText,   color: 'text-blue-500',    bg: 'hover:bg-blue-50' },
];

function ChannelDot({ slug }: { slug?: ChannelSlug }) {
  if (!slug) return null;
  const ch = CHANNEL_CONFIG[slug];
  if (!ch) return null;
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-black text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: ch.color }} title={ch.label}>
      {ch.icon}
    </span>
  );
}

export function BookingGrid({ bookings, properties }: BookingGridProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [numDays, setNumDays] = useState(14);
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null);
  const [tooltipBooking, setTooltipBooking] = useState<Booking | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dayAction, setDayAction] = useState<DayAction | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalInput, setModalInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearAll = useCallback(() => {
    setDayAction(null);
    setSelection(null);
    setActiveModal(null);
    setModalInput('');
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
  }, []);

  useEffect(() => {
    if (!dayAction && !selection && !activeModal) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (modalRef.current?.contains(target)) return;
      if (gridRef.current?.contains(target)) return;
      clearAll();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [dayAction, selection, activeModal, clearAll]);

  useEffect(() => {
    return () => { if (selectionTimer.current) clearTimeout(selectionTimer.current); };
  }, []);

  const days = useMemo(() => Array.from({ length: numDays }, (_, i) => addDays(startDate, i)), [startDate, numDays]);
  const rangeFrom = format(days[0], 'yyyy-MM-dd');
  const rangeTo = format(addDays(days[days.length - 1], 1), 'yyyy-MM-dd');

  // Fetch calendar data for ALL properties in one batch
  const propertyIds = useMemo(() => properties.map(p => p.id), [properties]);
  const { data: calendarMap } = useQuery({
    queryKey: ['grid-calendar', propertyIds, rangeFrom, rangeTo],
    queryFn: async () => {
      const results: Record<string, CalendarDayData[]> = {};
      await Promise.all(propertyIds.map(async (pid) => {
        try {
          const data = await api.get<CalendarDayData[]>('/properties/' + pid + '/calendar', { from: rangeFrom, to: rangeTo });
          results[pid] = data;
        } catch {
          results[pid] = [];
        }
      }));
      return results;
    },
    enabled: propertyIds.length > 0,
    staleTime: 30000,
  });

  // Helper to get calendar info for a specific property+date
  const getCalendarDay = useCallback((propertyId: string, day: Date): CalendarDayData | undefined => {
    if (!calendarMap) return undefined;
    const propDays = calendarMap[propertyId];
    if (!propDays) return undefined;
    const dateStr = format(day, 'yyyy-MM-dd');
    return propDays.find(d => d.date === dateStr);
  }, [calendarMap]);

  const activeBookings = useMemo(() => bookings.filter(b => b.status !== 'cancelled'), [bookings]);

  const dailyCounts = useMemo(() => days.map(day => activeBookings.filter(b => {
    const ci = parseISO(b.checkIn); const co = parseISO(b.checkOut);
    return isWithinInterval(day, { start: ci, end: subDays(co, 1) }) || isSameDay(day, ci);
  }).length), [days, activeBookings]);

  const getPropertyBookings = useCallback((propertyId: string) => {
    const rangeStart = days[0]; const rangeEnd = days[days.length - 1];
    return bookings.filter(b => {
      if (b.propertyId !== propertyId) return false;
      const ci = parseISO(b.checkIn); const co = parseISO(b.checkOut);
      return ci <= rangeEnd && co > rangeStart;
    });
  }, [bookings, days]);

  const getBookingSpan = useCallback((booking: Booking) => {
    const ci = parseISO(booking.checkIn); const co = parseISO(booking.checkOut);
    const rangeStart = days[0]; const rangeEnd = addDays(days[days.length - 1], 1);
    const visibleStart = ci < rangeStart ? rangeStart : ci;
    const visibleEnd = co > rangeEnd ? rangeEnd : co;
    return {
      startCol: Math.max(0, differenceInDays(visibleStart, rangeStart)),
      span: Math.max(1, differenceInDays(visibleEnd, visibleStart)),
      startsBeforeRange: ci < rangeStart,
      endsAfterRange: co > rangeEnd,
    };
  }, [days]);

  const navigateGrid = (dir: number) => setStartDate(d => addDays(d, dir * numDays));
  const goToToday = () => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleBookingHover = (booking: Booking, e: React.MouseEvent) => {
    setHoveredBooking(booking.id); setTooltipBooking(booking);
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
  };

  // A day has a booking on it?
  const hasDayBooking = useCallback((propertyId: string, day: Date) => {
    return bookings.some(b => {
      if (b.propertyId !== propertyId || b.status === 'cancelled') return false;
      const ci = parseISO(b.checkIn); const co = parseISO(b.checkOut);
      return isWithinInterval(day, { start: ci, end: subDays(co, 1) }) || isSameDay(day, ci);
    });
  }, [bookings]);

  // Can the user click this cell? (no booking on it)
  const isCellClickable = useCallback((propertyId: string, day: Date) => {
    return !hasDayBooking(propertyId, day);
  }, [hasDayBooking]);

  const isDaySelected = useCallback((propertyId: string, day: Date) => {
    if (!selection || selection.propertyId !== propertyId) return false;
    return selection.dates.some(d => isSameDay(d, day));
  }, [selection]);

  const startMenuTimer = useCallback((sel: SelectionState, x: number, y: number) => {
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
    selectionTimer.current = setTimeout(() => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sorted = [...sel.dates].sort((a, b) => a.getTime() - b.getTime());
      setDayAction({ propertyId: sel.propertyId, propertyName: sel.propertyName, dates: sorted, x: Math.min(x, rect.width - 220), y: y + 10 });
    }, 2000);
  }, []);

  const handleDayCellClick = (propertyId: string, propertyName: string, day: Date, e: React.MouseEvent) => {
    if (!isCellClickable(propertyId, day)) return;
    setDayAction(null);
    setActiveModal(null);
    const rect = gridRef.current?.getBoundingClientRect();
    const clickX = rect ? e.clientX - rect.left : 0;
    const clickY = rect ? e.clientY - rect.top : 0;
    lastClickRef.current = { x: clickX, y: clickY };
    setSelection(prev => {
      let next: SelectionState;
      if (prev && prev.propertyId === propertyId) {
        const already = prev.dates.some(d => isSameDay(d, day));
        const newDates = already ? prev.dates.filter(d => !isSameDay(d, day)) : [...prev.dates, day];
        if (newDates.length === 0) { if (selectionTimer.current) clearTimeout(selectionTimer.current); return null; }
        next = { propertyId, propertyName, dates: newDates };
      } else {
        next = { propertyId, propertyName, dates: [day] };
      }
      startMenuTimer(next, clickX, clickY);
      return next;
    });
  };

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['grid-calendar'] });
  }, [queryClient]);

  const callCalendarAPI = async (propertyId: string, dates: Date[], payload: Record<string, unknown>) => {
    const daysPayload = dates.map(d => ({ date: format(d, 'yyyy-MM-dd'), ...payload }));
    await api.put('/properties/' + propertyId + '/calendar', { days: daysPayload });
  };

  const handleDayActionClick = async (actionId: string) => {
    if (!dayAction) return;
    const sorted = [...dayAction.dates].sort((a, b) => a.getTime() - b.getTime());

    if (actionId === 'create') {
      const checkIn = format(sorted[0], 'yyyy-MM-dd');
      const checkOut = format(addDays(sorted[sorted.length - 1], 1), 'yyyy-MM-dd');
      navigate('/dashboard/bookings/new?propertyId=' + dayAction.propertyId + '&checkIn=' + checkIn + '&checkOut=' + checkOut);
      clearAll();
      return;
    }

    if (actionId === 'block') {
      setActionLoading(true);
      try {
        await callCalendarAPI(dayAction.propertyId, sorted, { isBlocked: true, blockReason: 'Bloqueio manual' });
        toast.success('Datas bloqueadas! (' + sorted.length + ' dia(s))');
        refreshData();
      } catch { toast.error('Erro ao bloquear datas'); }
      setActionLoading(false);
      clearAll();
      return;
    }

    if (actionId === 'unblock') {
      setActionLoading(true);
      try {
        await callCalendarAPI(dayAction.propertyId, sorted, { isBlocked: false });
        toast.success('Datas desbloqueadas! (' + sorted.length + ' dia(s))');
        refreshData();
      } catch { toast.error('Erro ao desbloquear datas'); }
      setActionLoading(false);
      clearAll();
      return;
    }

    if (actionId === 'price' || actionId === 'min_stay' || actionId === 'note') {
      setActiveModal(actionId);
      setModalInput('');
      return;
    }
  };

  const handleModalSubmit = async () => {
    if (!dayAction) return;
    const sorted = [...dayAction.dates].sort((a, b) => a.getTime() - b.getTime());
    setActionLoading(true);

    try {
      if (activeModal === 'price') {
        const val = modalInput.trim() === '' ? null : parseFloat(modalInput.replace(',', '.'));
        if (val !== null && (isNaN(val) || val < 0)) { toast.error('Valor invalido'); setActionLoading(false); return; }
        await callCalendarAPI(dayAction.propertyId, sorted, { priceOverride: val });
        toast.success(val ? 'Preco atualizado para ' + formatCurrency(val) + ' (' + sorted.length + ' dia(s))' : 'Preco restaurado ao valor base');
      } else if (activeModal === 'min_stay') {
        const val = modalInput.trim() === '' ? null : parseInt(modalInput, 10);
        if (val !== null && (isNaN(val) || val < 1)) { toast.error('Valor invalido'); setActionLoading(false); return; }
        await callCalendarAPI(dayAction.propertyId, sorted, { minStay: val });
        toast.success(val ? 'Estadia minima: ' + val + ' noite(s)' : 'Estadia minima removida');
      } else if (activeModal === 'note') {
        const val = modalInput.trim() || null;
        await callCalendarAPI(dayAction.propertyId, sorted, { note: val });
        toast.success(val ? 'Nota adicionada' : 'Nota removida');
      }
      refreshData();
    } catch { toast.error('Erro ao salvar'); }

    setActionLoading(false);
    clearAll();
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const propColClass = 'w-[140px] sm:w-[180px] flex-shrink-0';
  const dayCellClass = numDays <= 7 ? 'min-w-[100px] sm:min-w-[120px]' : numDays <= 14 ? 'min-w-[70px] sm:min-w-[90px]' : 'min-w-[44px] sm:min-w-[56px]';
  const basePrice = dayAction ? properties.find(p => p.id === dayAction.propertyId)?.pricePerNight : undefined;

  return (
    <div className="card-base overflow-hidden relative" ref={gridRef}>
      {/* TOOLBAR */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-surface-border bg-gradient-to-r from-neutral-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="w-4 h-4 text-primary" /></div>
          <div>
            <h2 className="font-bold text-neutral-800 text-sm sm:text-base leading-tight">Mapa de Reservas</h2>
            <p className="text-[10px] text-neutral-400">{format(days[0], "dd MMM", { locale: ptBR })} — {format(days[days.length - 1], "dd MMM yyyy", { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-surface-border overflow-hidden shadow-sm">
            {DAYS_OPTIONS.map(d => (<button key={d} onClick={() => setNumDays(d)} className={'px-2.5 py-1.5 text-xs font-semibold transition-colors ' + (numDays === d ? 'bg-primary text-white shadow-inner' : 'bg-white text-neutral-500 hover:bg-neutral-50')}>{d}d</button>))}
          </div>
          <div className="flex items-center rounded-lg border border-surface-border overflow-hidden shadow-sm">
            <button onClick={() => navigateGrid(-1)} className="px-2 py-1.5 hover:bg-neutral-50 transition-colors"><ChevronLeft className="w-4 h-4 text-neutral-500" /></button>
            <button onClick={goToToday} className="px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 text-primary border-x border-surface-border transition-colors">Hoje</button>
            <button onClick={() => navigateGrid(1)} className="px-2 py-1.5 hover:bg-neutral-50 transition-colors"><ChevronRight className="w-4 h-4 text-neutral-500" /></button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <div className="inline-flex flex-col min-w-full">
          {/* Header */}
          <div className="flex border-b border-surface-border bg-white sticky top-0 z-10">
            <div className={propColClass + ' px-3 py-2.5 border-r border-surface-border flex items-center gap-1.5'}>
              <Building2 className="w-3.5 h-3.5 text-neutral-400" /><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Propriedade</span>
            </div>
            {days.map((day, i) => {
              const today = isToday(day); const isWeekend = day.getDay() === 0 || day.getDay() === 6; const isPast = isBefore(day, new Date()) && !today;
              return (<div key={i} className={dayCellClass + ' flex-1 px-1 py-2 text-center border-r border-surface-border last:border-r-0 transition-colors ' + (today ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : isWeekend ? 'bg-neutral-50' : '') + (isPast ? ' opacity-50' : '')}>
                <div className={'text-[9px] font-bold uppercase tracking-wider ' + (today ? 'text-primary' : 'text-neutral-400')}>{format(day, 'EEE', { locale: ptBR })}</div>
                <div className={'text-sm font-black ' + (today ? 'text-primary' : 'text-neutral-700')}>{format(day, 'd')}</div>
                {numDays <= 14 && <div className={'text-[9px] ' + (today ? 'text-primary/60' : 'text-neutral-300')}>{format(day, 'MMM', { locale: ptBR })}</div>}
              </div>);
            })}
          </div>

          {/* Occupancy */}
          <div className="flex border-b-2 border-surface-border bg-white">
            <div className={propColClass + ' px-3 py-1.5 border-r border-surface-border flex items-center gap-1'}>
              <Users className="w-3 h-3 text-neutral-400" /><span className="text-[10px] font-semibold text-neutral-400">Ocupacao</span>
            </div>
            {dailyCounts.map((count, i) => {
              const today = isToday(days[i]); const pct = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0;
              return (<div key={i} className={dayCellClass + ' flex-1 flex flex-col items-center justify-center border-r border-surface-border last:border-r-0 py-1 ' + (today ? 'bg-primary/5' : '')}>
                <span className={'text-xs font-black ' + (count === 0 ? 'text-neutral-200' : pct >= 100 ? 'text-red-500' : pct >= 75 ? 'text-amber-500' : 'text-emerald-500')}>{count}</span>
                {numDays <= 14 && properties.length > 0 && <div className="w-full px-1.5 mt-0.5"><div className="h-1 rounded-full bg-neutral-100 overflow-hidden"><div className={'h-full rounded-full transition-all ' + (pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: Math.min(pct, 100) + '%' }} /></div></div>}
              </div>);
            })}
          </div>

          {/* Property rows */}
          {properties.map((property) => {
            const propBookings = getPropertyBookings(property.id);
            return (<div key={property.id} className="flex border-b border-surface-border/80 hover:bg-blue-50/30 transition-colors relative group">
              <div className={propColClass + ' px-3 py-3 border-r border-surface-border flex items-center gap-2 bg-white group-hover:bg-blue-50/30 transition-colors sticky left-0 z-[5]'}>
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex-shrink-0 ring-1 ring-primary/10" />
                <span className="text-xs font-semibold text-neutral-700 truncate" title={property.name}>{property.name}</span>
              </div>
              <div className="flex flex-1 relative">
                {days.map((day, i) => {
                  const today = isToday(day); const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const hasBooking = hasDayBooking(property.id, day);
                  const calDay = getCalendarDay(property.id, day);
                  const blocked = calDay?.isBlocked === true;
                  const priceOverride = calDay?.priceOverride;
                  const clickable = !hasBooking;
                  const selected = isDaySelected(property.id, day);
                  const displayPrice = priceOverride ?? property.pricePerNight;
                  const hasCustomPrice = priceOverride != null && priceOverride !== property.pricePerNight;

                  return (<div key={i} onClick={(e) => clickable && handleDayCellClick(property.id, property.name, day, e)}
                    className={dayCellClass + ' flex-1 border-r border-surface-border/60 last:border-r-0 transition-colors '
                      + (selected ? 'bg-primary/15 ring-1 ring-inset ring-primary/40 '
                        : blocked ? 'bg-red-50/80 '
                        : today ? 'bg-primary/[0.04] '
                        : isWeekend ? 'bg-neutral-50/60 '
                        : '')
                      + (clickable ? 'cursor-pointer hover:bg-emerald-50/40 group/cell ' : '')}
                    style={{ minHeight: '48px' }}>

                    {/* BLOCKED cell */}
                    {blocked && !hasBooking && !selected && (
                      <div className="w-full h-full flex flex-col items-center justify-center" title={calDay?.blockReason || 'Bloqueado'}>
                        <Lock className="w-3 h-3 text-red-400 mb-0.5" />
                        <span className="text-[8px] font-semibold text-red-400">Bloqueado</span>
                      </div>
                    )}

                    {/* AVAILABLE cell (not blocked, not booked) */}
                    {!blocked && !hasBooking && !selected && (
                      <div className="w-full h-full flex flex-col items-center justify-center group/cell">
                        {displayPrice ? (
                          <>
                            <span className={'text-[10px] font-bold transition-colors '
                              + (hasCustomPrice ? 'text-amber-600' : 'text-emerald-600/70 group-hover/cell:text-emerald-600')}>
                              {formatCurrency(displayPrice)}
                            </span>
                            <span className={'text-[8px] transition-colors '
                              + (hasCustomPrice ? 'text-amber-500/60' : 'text-neutral-300 group-hover/cell:text-neutral-400')}>
                              {hasCustomPrice ? 'customizado' : '/noite'}
                            </span>
                          </>
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}

                    {/* SELECTED cell */}
                    {selected && <div className="w-full h-full flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /></div>}
                  </div>);
                })}

                {/* Booking bars */}
                {propBookings.map((booking) => {
                  const { startCol, span, startsBeforeRange, endsAfterRange } = getBookingSpan(booking);
                  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.confirmed;
                  const isHovered = hoveredBooking === booking.id;
                  const leftPct = (startCol / numDays) * 100; const widthPct = (span / numDays) * 100;
                  return (<div key={booking.id}
                    className={'absolute top-1 bottom-1 ' + colors.bg + ' ' + colors.text + ' border ' + colors.border + ' flex items-center gap-1 px-1.5 cursor-pointer transition-all duration-150 select-none ' + (startsBeforeRange ? 'rounded-r-lg' : 'rounded-lg') + ' ' + (endsAfterRange ? 'rounded-l-lg rounded-r-none' : '') + ' ' + (startsBeforeRange && endsAfterRange ? 'rounded-none' : '') + ' ' + (isHovered ? 'shadow-xl scale-[1.03] z-20 brightness-110' : 'z-10 shadow-sm hover:shadow-lg')}
                    style={{ left: leftPct + '%', width: widthPct + '%' }}
                    onClick={() => navigate('/dashboard/bookings/' + booking.id + '/manage')}
                    onMouseEnter={(e) => handleBookingHover(booking, e)}
                    onMouseLeave={() => { setHoveredBooking(null); setTooltipBooking(null); }}>
                    <ChannelDot slug={booking.channelSource} />
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
                      <span className="text-[11px] font-bold truncate whitespace-nowrap drop-shadow-sm">{booking.guestName.split(' ').slice(0, 2).join(' ')}</span>
                      {span >= 3 && numDays <= 14 && <span className="text-[10px] opacity-80 flex-shrink-0 hidden sm:inline font-medium">{formatCurrency(booking.totalPrice)}</span>}
                    </div>
                    {span >= 2 && <span className="text-[9px] font-bold opacity-70 flex-shrink-0 bg-black/10 rounded px-1 py-0.5">{booking.nights}n</span>}
                  </div>);
                })}
              </div>
            </div>);
          })}

          {properties.length === 0 && <div className="px-8 py-16 text-center"><Building2 className="w-10 h-10 text-neutral-200 mx-auto mb-3" /><p className="text-sm font-medium text-neutral-400">Nenhuma propriedade cadastrada</p></div>}
        </div>
      </div>

      {/* TOOLTIP */}
      {tooltipBooking && (
        <div className="absolute z-50 bg-white rounded-xl shadow-2xl border border-surface-border p-3 pointer-events-none w-[260px]" style={{ left: Math.min(tooltipPos.x, (gridRef.current?.offsetWidth || 400) - 280), top: Math.max(tooltipPos.y - 140, 10) }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0"><p className="font-bold text-sm text-neutral-800 truncate">{tooltipBooking.guestName}</p><p className="text-[11px] text-neutral-400 truncate">{tooltipBooking.propertyName}</p></div>
            {tooltipBooking.channelSource && CHANNEL_CONFIG[tooltipBooking.channelSource] && <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: CHANNEL_CONFIG[tooltipBooking.channelSource].color }}>{CHANNEL_CONFIG[tooltipBooking.channelSource].label}</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div><span className="text-neutral-300 text-[10px] uppercase font-medium">Check-in</span><p className="font-semibold text-neutral-700">{format(parseISO(tooltipBooking.checkIn), 'dd/MM/yyyy')}</p></div>
            <div><span className="text-neutral-300 text-[10px] uppercase font-medium">Check-out</span><p className="font-semibold text-neutral-700">{format(parseISO(tooltipBooking.checkOut), 'dd/MM/yyyy')}</p></div>
            <div><span className="text-neutral-300 text-[10px] uppercase font-medium">Noites</span><p className="font-semibold text-neutral-700">{tooltipBooking.nights}</p></div>
            <div><span className="text-neutral-300 text-[10px] uppercase font-medium">Total</span><p className="font-black text-primary">{formatCurrency(tooltipBooking.totalPrice)}</p></div>
          </div>
          <div className="mt-2 pt-2 border-t border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-1.5"><span className={'w-2 h-2 rounded-full ' + (STATUS_COLORS[tooltipBooking.status]?.bg || 'bg-neutral-300')} /><span className="text-[10px] text-neutral-500 font-medium">{STATUS_COLORS[tooltipBooking.status]?.label || tooltipBooking.status}</span></div>
            <span className="text-[10px] text-neutral-300">{tooltipBooking.confirmationCode}</span>
          </div>
        </div>
      )}

      {/* ACTION MENU */}
      {dayAction && !activeModal && (
        <div ref={menuRef} className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-surface-border overflow-hidden w-[210px]" style={{ left: dayAction.x, top: Math.min(dayAction.y, (gridRef.current?.offsetHeight || 400) - 300) }}>
          <div className="px-4 py-2.5 bg-gradient-to-r from-neutral-50 to-white border-b border-surface-border flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-700">Acoes</p>
              <p className="text-[10px] text-neutral-400">{dayAction.propertyName} {'\u00b7'} {dayAction.dates.length === 1 ? format(dayAction.dates[0], 'dd MMM', { locale: ptBR }) : format(dayAction.dates[0], 'dd MMM', { locale: ptBR }) + ' \u2014 ' + format(dayAction.dates[dayAction.dates.length - 1], 'dd MMM', { locale: ptBR })} ({dayAction.dates.length} {dayAction.dates.length === 1 ? 'dia' : 'dias'})</p>
            </div>
            <button onClick={clearAll} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"><X className="w-3.5 h-3.5 text-neutral-400" /></button>
          </div>
          <div className="p-1.5">
            {actionLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
            ) : (
              DAY_ACTIONS.map(action => (<button key={action.id} onClick={() => handleDayActionClick(action.id)} className={'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ' + action.bg}><action.icon className={'w-4 h-4 ' + action.color + ' flex-shrink-0'} /><span className="text-sm font-medium text-neutral-700">{action.label}</span></button>))
            )}
          </div>
        </div>
      )}

      {/* INLINE MODAL */}
      {dayAction && activeModal && (
        <div ref={modalRef} className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-surface-border overflow-hidden w-[260px]" style={{ left: dayAction.x, top: Math.min(dayAction.y, (gridRef.current?.offsetHeight || 400) - 280) }}>
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <p className="text-sm font-bold text-neutral-800">
              {activeModal === 'price' ? 'Preco por noite' : activeModal === 'min_stay' ? 'Estadia minima' : 'Nota interna'}
            </p>
            <button onClick={clearAll} className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"><X className="w-3.5 h-3.5 text-neutral-400" /></button>
          </div>
          <div className="p-4">
            {activeModal === 'price' && basePrice != null && (
              <p className="text-xs text-neutral-400 mb-2">Preco base: <span className="font-semibold text-neutral-600">{formatCurrency(basePrice)}</span></p>
            )}
            <input
              type={activeModal === 'note' ? 'text' : 'number'}
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder={activeModal === 'price' ? 'Ex: 350.00' : activeModal === 'min_stay' ? 'Ex: 2' : 'Escreva uma nota...'}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleModalSubmit(); }}
              min={activeModal === 'min_stay' ? '1' : '0'}
              step={activeModal === 'price' ? '0.01' : '1'}
            />
            <p className="text-[10px] text-neutral-400 mt-1.5">
              {activeModal === 'price' ? 'Deixe vazio para restaurar o preco base' : activeModal === 'min_stay' ? 'Deixe vazio para remover restricao' : 'Deixe vazio para remover a nota'}
            </p>
            <button onClick={handleModalSubmit} disabled={actionLoading}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Aplicar em {dayAction.dates.length} dia(s)
            </button>
          </div>
        </div>
      )}

      {/* LEGEND */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-2.5 border-t border-surface-border bg-gradient-to-r from-neutral-50 to-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'cancelled').map(([key, cfg]) => (<span key={key} className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium"><span className={'w-3 h-2 rounded-sm ' + cfg.bg} /> {cfg.label}</span>))}
            <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-medium"><Lock className="w-2.5 h-2.5 text-red-400" /> Bloqueado</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 border-l border-surface-border pl-3">
            {Object.entries(CHANNEL_CONFIG).slice(0, 3).map(([key, cfg]) => (<span key={key} className="flex items-center gap-1 text-[10px] text-neutral-400"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />{cfg.label}</span>))}
          </div>
        </div>
        <span className="text-[10px] text-neutral-400 font-medium">{activeBookings.length} reserva(s) - {properties.length} propriedade(s)</span>
      </div>
    </div>
  );
}