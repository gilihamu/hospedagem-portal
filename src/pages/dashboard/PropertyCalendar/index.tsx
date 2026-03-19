import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addDays, eachDayOfInterval, isSameMonth,
  isToday, isBefore, isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, ArrowLeft, DollarSign, Ban, CalendarPlus,
  StickyNote, Clock, Eraser, Loader2, Check, LogIn, LogOut,
} from 'lucide-react';
import { useProperty } from '../../../hooks/useProperties';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';
import { api } from '../../../lib/api';
import { ROUTES } from '../../../router/routes';

// ── Types ──
interface CalendarDayData {
  date: string;
  priceOverride: number | null;
  isBlocked: boolean;
  blockReason: string | null;
  minStay: number | null;
  note: string | null;
}

interface PropertyBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  confirmationCode: string;
}

type ActionMode = 'price' | 'block' | 'reserve' | 'minstay' | 'note' | null;

const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ── Helpers ──────────────────────────────────────────────────────────────
function buildWeeks(month: Date): Date[][] {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

// ── Main Component ───────────────────────────────────────────────────────
export function PropertyCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading: loadingProp } = useProperty(id || '');
  const { success, error: showError } = useToast();

  const [month, setMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [propertyBookings, setPropertyBookings] = useState<PropertyBooking[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [saving, setSaving] = useState(false);

  // Form state for actions
  const [priceValue, setPriceValue] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [minStayValue, setMinStayValue] = useState('');
  const [noteValue, setNoteValue] = useState('');

  // Load calendar data + bookings for this property
  useEffect(() => {
    if (!id) return;
    const from = format(startOfMonth(month), 'yyyy-MM-dd');
    const to = format(endOfMonth(month), 'yyyy-MM-dd');
    setLoadingCal(true);

    Promise.all([
      api.get<CalendarDayData[]>(`/properties/${id}/calendar?from=${from}&to=${to}`).catch(() => []),
      api.get<PropertyBooking[]>(`/bookings/calendar/${id}?from=${from}&to=${to}`).catch(() => []),
    ]).then(([cal, bkgs]) => {
      setCalendarData(cal);
      setPropertyBookings(bkgs);
    }).finally(() => setLoadingCal(false));
  }, [id, month]);

  const weeks = useMemo(() => buildWeeks(month), [month]);

  // Day data lookup
  const dayDataMap = useMemo(() => {
    const map = new Map<string, CalendarDayData>();
    calendarData.forEach(d => map.set(d.date, d));
    return map;
  }, [calendarData]);

  // Booking lookup by day
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, PropertyBooking>();
    propertyBookings.forEach(b => {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        map.set(format(d, 'yyyy-MM-dd'), b);
      }
    });
    return map;
  }, [propertyBookings]);

  // Check-in / Check-out markers
  const { checkInDates, checkOutDates } = useMemo(() => {
    const ciMap = new Map<string, PropertyBooking>();
    const coMap = new Map<string, PropertyBooking>();
    propertyBookings.forEach(b => {
      ciMap.set(b.checkIn, b);
      coMap.set(b.checkOut, b);
    });
    return { checkInDates: ciMap, checkOutDates: coMap };
  }, [propertyBookings]);

  // Selection
  const isSelected = useCallback((day: Date) =>
    selectedDays.some(s => isSameDay(s, day)), [selectedDays]);

  const handleDayClick = useCallback((day: Date) => {
    if (isBefore(day, new Date()) && !isToday(day)) return;
    // Don't allow selecting days with existing bookings
    const dateStr = format(day, 'yyyy-MM-dd');
    if (bookingsByDay.has(dateStr)) return;
    setSelectedDays(prev => {
      const exists = prev.some(s => isSameDay(s, day));
      if (exists) return prev.filter(s => !isSameDay(s, day));
      return [...prev, day].sort((a, b) => a.getTime() - b.getTime());
    });
  }, [bookingsByDay]);

  const clearSelection = useCallback(() => {
    setSelectedDays([]);
    setActionMode(null);
  }, []);

  // Actions
  const handleApply = useCallback(async () => {
    if (!id || selectedDays.length === 0 || !actionMode) return;
    setSaving(true);
    try {
      const days = selectedDays.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const existing = dayDataMap.get(dateStr);
        const base = {
          date: dateStr,
          priceOverride: existing?.priceOverride ?? null,
          isBlocked: existing?.isBlocked ?? false,
          blockReason: existing?.blockReason ?? null,
          minStay: existing?.minStay ?? null,
          note: existing?.note ?? null,
        };

        switch (actionMode) {
          case 'price':
            return { ...base, priceOverride: priceValue ? Number(priceValue) : null };
          case 'block':
            return { ...base, isBlocked: true, blockReason: blockReason || 'Bloqueado pelo anfitrião' };
          case 'minstay':
            return { ...base, minStay: minStayValue ? Number(minStayValue) : null };
          case 'note':
            return { ...base, note: noteValue || null };
          default:
            return base;
        }
      });

      await api.put(`/properties/${id}/calendar`, { days });
      success(`${days.length} dia(s) atualizado(s) com sucesso!`);

      // Reload calendar
      const from = format(startOfMonth(month), 'yyyy-MM-dd');
      const to = format(endOfMonth(month), 'yyyy-MM-dd');
      const fresh = await api.get<CalendarDayData[]>(`/properties/${id}/calendar?from=${from}&to=${to}`);
      setCalendarData(fresh);
      clearSelection();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar alterações';
      showError(msg);
    } finally {
      setSaving(false);
    }
  }, [id, selectedDays, actionMode, priceValue, blockReason, minStayValue, noteValue, dayDataMap, month, success, showError, clearSelection]);

  const handleUnblock = useCallback(async () => {
    if (!id || selectedDays.length === 0) return;
    setSaving(true);
    try {
      const days = selectedDays.map(d => ({
        date: format(d, 'yyyy-MM-dd'),
        priceOverride: dayDataMap.get(format(d, 'yyyy-MM-dd'))?.priceOverride ?? null,
        isBlocked: false,
        blockReason: null,
        minStay: dayDataMap.get(format(d, 'yyyy-MM-dd'))?.minStay ?? null,
        note: dayDataMap.get(format(d, 'yyyy-MM-dd'))?.note ?? null,
      }));
      await api.put(`/properties/${id}/calendar`, { days });
      success('Datas desbloqueadas!');
      const from = format(startOfMonth(month), 'yyyy-MM-dd');
      const to = format(endOfMonth(month), 'yyyy-MM-dd');
      const fresh = await api.get<CalendarDayData[]>(`/properties/${id}/calendar?from=${from}&to=${to}`);
      setCalendarData(fresh);
      clearSelection();
    } catch {
      showError('Erro ao desbloquear');
    } finally {
      setSaving(false);
    }
  }, [id, selectedDays, dayDataMap, month, success, showError, clearSelection]);

  const handleReserve = useCallback(() => {
    if (selectedDays.length === 0 || !property) return;

    // Check if any selected day has a booking
    const booked = selectedDays.filter(d => bookingsByDay.has(format(d, 'yyyy-MM-dd')));
    if (booked.length > 0) {
      showError('Algumas datas selecionadas já possuem reservas.');
      return;
    }

    // Warn if any selected day is blocked
    const blocked = selectedDays.filter(d => dayDataMap.get(format(d, 'yyyy-MM-dd'))?.isBlocked);
    if (blocked.length > 0) {
      showError('Algumas datas selecionadas estão bloqueadas. Desbloqueie-as antes de criar a reserva.');
      return;
    }

    const sorted = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());
    const ci = format(sorted[0], 'yyyy-MM-dd');
    const co = format(addDays(sorted[sorted.length - 1], 1), 'yyyy-MM-dd');

    // Build day prices from calendar overrides (date:price pairs)
    const dayPrices = sorted.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const override = dayDataMap.get(dateStr)?.priceOverride;
      const price = override ?? property.pricePerNight;
      return `${dateStr}:${price}`;
    }).join(',');

    navigate(`${ROUTES.DASHBOARD_BOOKINGS_NEW}?checkIn=${ci}&checkOut=${co}&propertyId=${id}&dayPrices=${encodeURIComponent(dayPrices)}`);
  }, [selectedDays, id, navigate, dayDataMap, bookingsByDay, property, showError]);

  if (loadingProp) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!property) return <div className="text-center py-16 text-neutral-500">Propriedade não encontrada</div>;

  const selCount = selectedDays.length;
  const selRange = selCount > 0
    ? selCount === 1
      ? format(selectedDays[0], 'dd/MM')
      : `${format(selectedDays[0], 'dd/MM')} → ${format(selectedDays[selCount - 1], 'dd/MM')} (${selCount} dias)`
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={ROUTES.DASHBOARD_PROPERTIES}>
          <button className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-neutral-900 truncate">
            Calendário — {property.name}
          </h1>
          <p className="text-sm text-neutral-500">
            {property.address.city} · {formatCurrency(property.pricePerNight)}/noite
          </p>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* ── Calendar ── */}
        <div className="flex-1 space-y-3">
          {/* Month nav */}
          <div className="card-base p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
              <h2 className="text-lg font-bold text-neutral-900 min-w-[180px] text-center capitalize">
                {format(month, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                onClick={() => setMonth(new Date())}
                className="ml-1 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
              >
                Hoje
              </button>
            </div>
            {loadingCal && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          </div>

          {/* Grid */}
          <div className="card-base overflow-hidden">
            <div className="grid grid-cols-7 border-b border-surface-border bg-surface-muted/70">
              {DAY_HEADERS.map(h => (
                <div key={h} className="py-2.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider select-none">
                  {h}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-surface-border last:border-0">
                {week.map((day, di) => {
                  const inMonth = isSameMonth(day, month);
                  const today = isToday(day);
                  const isPast = isBefore(day, new Date()) && !today;
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const data = dayDataMap.get(dateStr);
                  const booking = bookingsByDay.get(dateStr);
                  const selected = isSelected(day);
                  const blocked = data?.isBlocked;
                  const hasPrice = data?.priceOverride != null;
                  const hasNote = !!data?.note;
                  const hasMinStay = data?.minStay != null;
                  const hasBooking = !!booking;
                  const checkInBooking = checkInDates.get(dateStr);
                  const checkOutBooking = checkOutDates.get(dateStr);

                  return (
                    <div
                      key={di}
                      onClick={() => inMonth && !isPast && handleDayClick(day)}
                      className={cn(
                        'relative border-r border-surface-border last:border-0 p-1 min-h-[80px] transition-all',
                        !inMonth && 'bg-neutral-50/80 opacity-40',
                        isPast && 'opacity-30 cursor-not-allowed',
                        inMonth && !isPast && hasBooking && 'cursor-not-allowed',
                        inMonth && !isPast && !hasBooking && 'cursor-pointer hover:bg-primary/5',
                        selected && 'ring-2 ring-inset ring-primary bg-primary/10',
                        blocked && !selected && 'bg-rose-50',
                        booking && !selected && !blocked && 'bg-sky-50',
                        today && !selected && 'bg-amber-50/50',
                      )}
                    >
                      {/* Day number */}
                      <div className="flex items-start justify-between">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium select-none',
                            selected ? 'bg-primary text-white font-bold'
                              : today ? 'bg-amber-500 text-white font-bold'
                              : inMonth ? 'text-neutral-700'
                              : 'text-neutral-300',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {/* Indicators */}
                        <div className="flex gap-0.5">
                          {blocked && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Bloqueado" />}
                          {hasNote && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Nota" />}
                          {hasMinStay && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" title={`Min. ${data!.minStay} noites`} />}
                        </div>
                      </div>

                      {/* Check-in / Check-out badges */}
                      {inMonth && (checkInBooking || checkOutBooking) && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {checkInBooking && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-100 rounded px-1 py-px leading-none w-fit" title={`Check-in: ${checkInBooking.guestName}`}>
                              <LogIn className="w-2.5 h-2.5" />
                              IN
                            </span>
                          )}
                          {checkOutBooking && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-orange-700 bg-orange-100 rounded px-1 py-px leading-none w-fit" title={`Check-out: ${checkOutBooking.guestName}`}>
                              <LogOut className="w-2.5 h-2.5" />
                              OUT
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      {inMonth && (
                        <div className="mt-0.5">
                          {hasPrice ? (
                            <span className="text-[10px] font-bold text-emerald-600 leading-none">
                              R$ {data!.priceOverride!.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-300 leading-none">
                              R$ {property.pricePerNight.toFixed(0)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Booking chip */}
                      {booking && inMonth && (
                        <div className="mt-0.5">
                          <span className={cn(
                            'text-[9px] font-medium px-1 py-0.5 rounded leading-none inline-block truncate max-w-full',
                            booking.status === 'confirmed' ? 'bg-primary/20 text-primary'
                              : booking.status === 'pending' ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700',
                          )}>
                            {booking.guestName.split(' ')[0]}
                          </span>
                        </div>
                      )}

                      {/* Blocked overlay */}
                      {blocked && inMonth && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Ban className="w-6 h-6 text-rose-300/50" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap px-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-100 border border-sky-200 inline-block" /> Reservado</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-200 inline-block" /> Bloqueado</span>
            <span className="flex items-center gap-1.5"><span className="inline-flex items-center text-[8px] font-bold text-emerald-700 bg-emerald-100 rounded px-1"><LogIn className="w-2.5 h-2.5 mr-0.5" />IN</span> Check-in</span>
            <span className="flex items-center gap-1.5"><span className="inline-flex items-center text-[8px] font-bold text-orange-700 bg-orange-100 rounded px-1"><LogOut className="w-2.5 h-2.5 mr-0.5" />OUT</span> Check-out</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Preço especial</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Nota</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Estadia mínima</span>
          </div>
        </div>

        {/* ── Action Panel ── */}
        <div className="w-full lg:w-80 space-y-3">
          {/* Selection info */}
          <div className="card-base p-4">
            <h3 className="font-bold text-neutral-800 text-sm mb-2">Seleção</h3>
            {selCount === 0 ? (
              <p className="text-xs text-neutral-400">
                Clique nos dias do calendário para selecionar. Você pode selecionar múltiplos dias.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default">{selRange}</Badge>
                  <button onClick={clearSelection} className="text-xs text-neutral-400 hover:text-neutral-600">
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {selCount > 0 && (
            <div className="card-base p-4 space-y-2">
              <h3 className="font-bold text-neutral-800 text-sm mb-3">Ações</h3>

              <ActionButton
                icon={DollarSign} label="Alterar preço" color="text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                active={actionMode === 'price'} onClick={() => setActionMode(actionMode === 'price' ? null : 'price')}
              />
              <ActionButton
                icon={Ban} label="Bloquear datas" color="text-rose-600 bg-rose-50 hover:bg-rose-100"
                active={actionMode === 'block'} onClick={() => setActionMode(actionMode === 'block' ? null : 'block')}
              />
              <ActionButton
                icon={CalendarPlus} label="Criar reserva" color="text-primary bg-primary/5 hover:bg-primary/10"
                active={false} onClick={handleReserve}
              />
              <ActionButton
                icon={Clock} label="Estadia mínima" color="text-violet-600 bg-violet-50 hover:bg-violet-100"
                active={actionMode === 'minstay'} onClick={() => setActionMode(actionMode === 'minstay' ? null : 'minstay')}
              />
              <ActionButton
                icon={StickyNote} label="Adicionar nota" color="text-amber-600 bg-amber-50 hover:bg-amber-100"
                active={actionMode === 'note'} onClick={() => setActionMode(actionMode === 'note' ? null : 'note')}
              />
              <ActionButton
                icon={Eraser} label="Desbloquear datas" color="text-neutral-600 bg-neutral-50 hover:bg-neutral-100"
                active={false} onClick={handleUnblock}
              />
            </div>
          )}

          {/* Action form */}
          {actionMode && selCount > 0 && (
            <div className="card-base p-4 space-y-3 border-primary/20">
              {actionMode === 'price' && (
                <>
                  <h4 className="font-semibold text-sm text-neutral-700">Preço por noite</h4>
                  <p className="text-xs text-neutral-400">Preço base: {formatCurrency(property.pricePerNight)}</p>
                  <Input
                    type="number"
                    placeholder="Ex: 350.00"
                    value={priceValue}
                    onChange={e => setPriceValue(e.target.value)}
                  />
                  <p className="text-[10px] text-neutral-400">Deixe vazio para restaurar o preço base</p>
                </>
              )}

              {actionMode === 'block' && (
                <>
                  <h4 className="font-semibold text-sm text-neutral-700">Bloquear {selCount} dia(s)</h4>
                  <Input
                    placeholder="Motivo (opcional)"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                  />
                  <p className="text-[10px] text-neutral-400">Datas bloqueadas não aceitam reservas</p>
                </>
              )}

              {actionMode === 'minstay' && (
                <>
                  <h4 className="font-semibold text-sm text-neutral-700">Estadia mínima</h4>
                  <Input
                    type="number"
                    placeholder="Ex: 2"
                    value={minStayValue}
                    onChange={e => setMinStayValue(e.target.value)}
                  />
                  <p className="text-[10px] text-neutral-400">Número mínimo de noites para reservas nestes dias</p>
                </>
              )}

              {actionMode === 'note' && (
                <>
                  <h4 className="font-semibold text-sm text-neutral-700">Nota interna</h4>
                  <Textarea
                    placeholder="Ex: Feriado, alta temporada..."
                    rows={2}
                    value={noteValue}
                    onChange={e => setNoteValue(e.target.value)}
                  />
                </>
              )}

              <Button
                className="w-full"
                onClick={handleApply}
                loading={saving}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Aplicar em {selCount} dia(s)
              </Button>
            </div>
          )}

          {/* Day details on hover — show info about selected days */}
          {selCount > 0 && !actionMode && (
            <div className="card-base p-4 space-y-2">
              <h3 className="font-bold text-neutral-800 text-sm">Detalhes</h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {selectedDays.slice(0, 10).map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const data = dayDataMap.get(dateStr);
                  const booking = bookingsByDay.get(dateStr);
                  return (
                    <div key={dateStr} className="flex items-center justify-between text-xs border-b border-surface-border pb-1.5 last:border-0">
                      <span className="font-medium text-neutral-700">{format(day, 'dd/MM (EEE)', { locale: ptBR })}</span>
                      <div className="flex items-center gap-2">
                        {data?.priceOverride != null && (
                          <span className="text-emerald-600 font-bold">R$ {data.priceOverride.toFixed(0)}</span>
                        )}
                        {data?.isBlocked && <Badge variant="error">Bloqueado</Badge>}
                        {booking && <Badge variant="default">{booking.guestName.split(' ')[0]}</Badge>}
                        {!data?.isBlocked && !booking && !data?.priceOverride && (
                          <span className="text-neutral-300">Livre</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {selCount > 10 && <p className="text-[10px] text-neutral-400">+{selCount - 10} dias...</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Action button ────────────────────────────────────────────────────────
function ActionButton({
  icon: Icon, label, color, active, onClick,
}: {
  icon: React.ElementType; label: string; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
        color,
        active && 'ring-2 ring-primary shadow-sm',
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </button>
  );
}
