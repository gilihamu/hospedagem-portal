import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, UserPlus, CalendarPlus, ArrowLeft, CheckCircle, Search, X, User as UserIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { useAuthStore } from '../../../store/auth.store';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { useCreateBooking } from '../../../hooks/useBookings';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/formatters';
import { differenceInDays } from '../../../utils/dates';
import { api } from '../../../lib/api';
import { ROUTES } from '../../../router/routes';
import type { Booking } from '../../../types';

// ─── Types ──────────────────────────────────────────────────
interface GuestResult {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

interface SelectedGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface PropertyCalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  confirmationCode: string;
}

// ─── Schemas ────────────────────────────────────────────────
const bookingSchema = z.object({
  propertyId: z.string().min(1, 'Selecione uma propriedade'),
  guestName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  guestEmail: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  guestPhone: z.string().optional(),
  checkIn: z.string().min(1, 'Data de check-in obrigatória'),
  checkOut: z.string().min(1, 'Data de check-out obrigatória'),
  guests: z.coerce.number().min(1, 'Mínimo 1 hóspede').max(50),
  customPricePerNight: z.coerce.number().min(0).optional(),
  specialRequests: z.string().optional(),
}).refine(data => {
  if (data.checkIn && data.checkOut) {
    return new Date(data.checkOut) > new Date(data.checkIn);
  }
  return true;
}, { message: 'Check-out deve ser após check-in', path: ['checkOut'] });

const newGuestSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
});

type BookingFormData = z.infer<typeof bookingSchema>;
type NewGuestFormData = z.infer<typeof newGuestSchema>;

// ─── Guest Search Hook ──────────────────────────────────────
function useGuestSearch() {
  const [results, setResults] = useState<GuestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((query: string) => {
    clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.get<GuestResult[]>('/auth/users/search', { q: query, limit: '8' });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}

// ─── Page Component ─────────────────────────────────────────
export function NewBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { data: properties, isLoading: loadingProps } = useOwnerProperties(user?.id);
  const createBooking = useCreateBooking();
  const { success, error: showError } = useToast();

  // Pre-fill from calendar selection
  const urlCheckIn = searchParams.get('checkIn') || '';
  const urlCheckOut = searchParams.get('checkOut') || '';
  const urlPropertyId = searchParams.get('propertyId') || '';
  const urlDayPrices = searchParams.get('dayPrices') || '';

  // Parse per-day prices from calendar (format: "2025-07-19:156,2025-07-20:3")
  const calendarDayPrices = useMemo(() => {
    if (!urlDayPrices) return null;
    const map = new Map<string, number>();
    urlDayPrices.split(',').forEach(entry => {
      const [date, price] = entry.split(':');
      if (date && price) map.set(date, Number(price));
    });
    return map.size > 0 ? map : null;
  }, [urlDayPrices]);

  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<SelectedGuest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { results: guestResults, loading: searchLoading, search: searchGuests, clear: clearSearch } = useGuestSearch();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema) as Resolver<BookingFormData>,
    defaultValues: {
      propertyId: urlPropertyId,
      guests: 1,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: urlCheckIn,
      checkOut: urlCheckOut,
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Guest selection ─────────────────────────────────────
  const handleSelectGuest = (guest: GuestResult) => {
    const selected: SelectedGuest = {
      id: guest.id,
      name: guest.fullName,
      email: guest.email,
      phone: guest.phoneNumber || '',
    };
    setSelectedGuest(selected);
    setValue('guestName', selected.name);
    setValue('guestEmail', selected.email);
    setValue('guestPhone', selected.phone);
    setSearchQuery('');
    setShowDropdown(false);
    clearSearch();
  };

  const handleClearGuest = () => {
    setSelectedGuest(null);
    setValue('guestName', '');
    setValue('guestEmail', '');
    setValue('guestPhone', '');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
    searchGuests(value);
  };

  // ─── New guest registered via modal ──────────────────────
  const handleGuestRegistered = (guest: SelectedGuest) => {
    setSelectedGuest(guest);
    setValue('guestName', guest.name);
    setValue('guestEmail', guest.email);
    setValue('guestPhone', guest.phone);
    setShowNewGuestModal(false);
    success('Hóspede cadastrado e selecionado!');
  };

  // ─── Form watches ────────────────────────────────────────
  const watchPropertyId = watch('propertyId');
  const watchCheckIn = watch('checkIn');
  const watchCheckOut = watch('checkOut');
  const watchCustomPrice = watch('customPricePerNight');

  const selectedProperty = useMemo(
    () => properties?.find(p => p.id === watchPropertyId),
    [properties, watchPropertyId],
  );

  const effectivePrice = useMemo(
    () => (watchCustomPrice && watchCustomPrice > 0) ? watchCustomPrice : selectedProperty?.pricePerNight ?? 0,
    [watchCustomPrice, selectedProperty],
  );

  // ─── Availability check ──────────────────────────────────
  useEffect(() => {
    if (!watchPropertyId || !watchCheckIn || !watchCheckOut) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('');
      return;
    }

    const checkInDate = new Date(watchCheckIn);
    const checkOutDate = new Date(watchCheckOut);
    if (checkOutDate <= checkInDate) {
      setAvailabilityStatus('idle');
      setAvailabilityMessage('');
      return;
    }

    let cancelled = false;
    setAvailabilityStatus('loading');
    setAvailabilityMessage('');

    Promise.all([
      api.get<{ blockedDates: string[] }>(`/properties/${watchPropertyId}/availability?from=${watchCheckIn}&to=${watchCheckOut}`).catch(() => ({ blockedDates: [] })),
      api.get<PropertyCalendarBooking[]>(`/bookings/calendar/${watchPropertyId}?from=${watchCheckIn}&to=${watchCheckOut}`).catch(() => []),
    ]).then(([availability, bookings]) => {
      if (cancelled) return;

      const blocked = availability.blockedDates?.filter(d => d >= watchCheckIn && d < watchCheckOut) || [];
      const overlapping = (bookings || []).filter(b =>
        b.status !== 'cancelled' && b.checkIn < watchCheckOut && b.checkOut > watchCheckIn
      );

      if (blocked.length > 0 && overlapping.length > 0) {
        setAvailabilityStatus('unavailable');
        setAvailabilityMessage(`Existem ${blocked.length} data(s) bloqueada(s) e ${overlapping.length} reserva(s) existente(s) neste período.`);
      } else if (blocked.length > 0) {
        setAvailabilityStatus('unavailable');
        setAvailabilityMessage(`Existem ${blocked.length} data(s) bloqueada(s) neste período.`);
      } else if (overlapping.length > 0) {
        setAvailabilityStatus('unavailable');
        setAvailabilityMessage(`Já existe(m) ${overlapping.length} reserva(s) neste período.`);
      } else {
        setAvailabilityStatus('available');
        setAvailabilityMessage('Datas disponíveis!');
      }
    }).catch(() => {
      if (!cancelled) {
        setAvailabilityStatus('idle');
        setAvailabilityMessage('');
      }
    });

    return () => { cancelled = true; };
  }, [watchPropertyId, watchCheckIn, watchCheckOut]);

  const nights = useMemo(() => {
    if (watchCheckIn && watchCheckOut) {
      const n = differenceInDays(watchCheckOut, watchCheckIn);
      return n > 0 ? n : 0;
    }
    return 0;
  }, [watchCheckIn, watchCheckOut]);

  // Calculate using per-day prices from calendar when available
  const hasCalendarPrices = calendarDayPrices && calendarDayPrices.size > 0 && !watchCustomPrice;

  const pricePreview = useMemo(() => {
    if (!selectedProperty || nights <= 0) return null;

    let subtotal: number;
    if (hasCalendarPrices && watchCheckIn) {
      // Sum each day's specific price from calendar
      subtotal = 0;
      const start = new Date(watchCheckIn);
      for (let i = 0; i < nights; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        subtotal += calendarDayPrices!.get(dateStr) ?? selectedProperty.pricePerNight;
      }
    } else {
      subtotal = effectivePrice * nights;
    }

    const taxes = subtotal * 0.1;
    return { subtotal, taxes, total: subtotal + taxes };
  }, [selectedProperty, nights, effectivePrice, hasCalendarPrices, calendarDayPrices, watchCheckIn]);

  const propertyOptions = useMemo(
    () => (properties || [])
      .filter(p => p.status === 'active' || p.status === 'pending')
      .map(p => ({ value: p.id, label: `${p.name} — ${p.address.city}` })),
    [properties],
  );

  const onSubmit = async (data: BookingFormData) => {
    try {
      const booking = await createBooking.mutateAsync({
        propertyId: data.propertyId,
        guestId: selectedGuest?.id || user?.id || '',
        guestName: data.guestName,
        guestEmail: data.guestEmail || '',
        guestPhone: data.guestPhone || '',
        checkIn: new Date(data.checkIn).toISOString(),
        checkOut: new Date(data.checkOut).toISOString(),
        guests: data.guests,
        specialRequests: data.specialRequests,
        customPricePerNight: (data.customPricePerNight && data.customPricePerNight > 0) ? data.customPricePerNight : undefined,
      });
      setConfirmed(booking);
      success('Reserva criada com sucesso!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao criar reserva');
    }
  };

  // ─── Confirmation screen ─────────────────────────────────
  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Reserva Criada!</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Código: <span className="font-mono font-semibold text-primary">{confirmed.confirmationCode}</span>
          </p>
        </div>
        <div className="card-base p-5 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Hóspede</span><span className="font-medium">{confirmed.guestName}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Propriedade</span><span className="font-medium">{confirmed.propertyName}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Check-in</span><span>{new Date(confirmed.checkIn).toLocaleDateString('pt-BR')}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Check-out</span><span>{new Date(confirmed.checkOut).toLocaleDateString('pt-BR')}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Hóspedes</span><span>{confirmed.guests}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2"><span className="text-neutral-500">Total</span><span className="font-bold text-primary">{formatCurrency(confirmed.totalPrice)}</span></div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD_BOOKINGS)}>
            Ver Reservas
          </Button>
          <Button onClick={() => { setConfirmed(null); setSelectedGuest(null); }}>
            Nova Reserva
          </Button>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.DASHBOARD_BOOKINGS)} className="p-1.5 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5 text-neutral-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Nova Reserva Manual
          </h1>
          <p className="text-sm text-neutral-500">Para reservas por telefone, balcão ou walk-in</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Property selection */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" />
            Acomodação e Datas
          </h2>
          <div className="space-y-4">
            <Select
              label="Propriedade *"
              options={propertyOptions}
              placeholder={loadingProps ? 'Carregando...' : 'Selecione uma propriedade'}
              error={errors.propertyId?.message}
              {...register('propertyId')}
            />
            {selectedProperty && (
              <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg text-sm">
                {selectedProperty.images?.[0]?.url && (
                  <img src={selectedProperty.images[0].url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-medium">{selectedProperty.name}</p>
                  <p className="text-neutral-500">{formatCurrency(selectedProperty.pricePerNight)}/noite · Máx {selectedProperty.maxGuests} hóspedes</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Check-in *" type="date" min={today} error={errors.checkIn?.message} {...register('checkIn')} />
              <Input label="Check-out *" type="date" min={watchCheckIn || today} error={errors.checkOut?.message} {...register('checkOut')} />
              <Input
                label="Hóspedes *"
                type="number"
                min={1}
                max={selectedProperty?.maxGuests || 50}
                error={errors.guests?.message}
                {...register('guests')}
              />
            </div>
            {/* Availability feedback */}
            {watchCheckIn && watchCheckOut && watchPropertyId && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                availabilityStatus === 'loading' ? 'bg-neutral-50 text-neutral-500' :
                availabilityStatus === 'available' ? 'bg-green-50 border border-green-200 text-green-700' :
                availabilityStatus === 'unavailable' ? 'bg-red-50 border border-red-200 text-red-700' :
                'hidden'
              }`}>
                {availabilityStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {availabilityStatus === 'available' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {availabilityStatus === 'unavailable' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                <span>{availabilityStatus === 'loading' ? 'Verificando disponibilidade...' : availabilityMessage}</span>
              </div>
            )}
            {selectedProperty && (
              <div className="mt-2">
                <Input
                  label={`Valor por noite (R$) — padrão: ${formatCurrency(selectedProperty.pricePerNight)}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={selectedProperty.pricePerNight.toString()}
                  error={errors.customPricePerNight?.message}
                  {...register('customPricePerNight')}
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Deixe em branco para usar o preço padrão. Preencha para aplicar um valor especial.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Guest info */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Hóspede
          </h2>

          {/* Selected guest badge */}
          {selectedGuest ? (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-green-900">{selectedGuest.name}</p>
                    <p className="text-xs text-green-600">{selectedGuest.email}{selectedGuest.phone ? ` · ${selectedGuest.phone}` : ''}</p>
                  </div>
                </div>
                <button type="button" onClick={handleClearGuest} className="p-1 rounded hover:bg-green-100 text-green-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Show phone field if guest has no phone */}
              {!selectedGuest.phone && (
                <Input
                  label="Telefone do hóspede"
                  placeholder="+55 (48) 99999-0000"
                  error={errors.guestPhone?.message}
                  {...register('guestPhone')}
                />
              )}
            </div>
          ) : (
            <>
              {/* Search field */}
              <div ref={searchRef} className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                    placeholder="Buscar hóspede por nome, e-mail ou telefone..."
                    className="w-full pl-10 pr-4 py-2.5 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>

                {/* Search dropdown */}
                {showDropdown && searchQuery.length >= 2 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-surface-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {guestResults.length > 0 ? (
                      guestResults.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleSelectGuest(g)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-muted text-left transition-colors border-b border-surface-border last:border-0"
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 truncate">{g.fullName}</p>
                            <p className="text-xs text-neutral-400 truncate">{g.email}{g.phoneNumber ? ` · ${g.phoneNumber}` : ''}</p>
                          </div>
                        </button>
                      ))
                    ) : !searchLoading ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-neutral-500 mb-3">Nenhum hóspede encontrado</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => { setShowDropdown(false); setShowNewGuestModal(true); }}
                          leftIcon={<UserPlus className="w-4 h-4" />}
                        >
                          Cadastrar Novo Hóspede
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border-t border-surface-border" />
                <span className="text-xs text-neutral-400">ou</span>
                <div className="flex-1 border-t border-surface-border" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-neutral-400">Preencha manualmente ou cadastre um novo hóspede</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewGuestModal(true)}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Novo Hóspede
                </Button>
              </div>

              {/* Manual fields */}
              <div className="space-y-4">
                <Input label="Nome completo *" placeholder="Ex: Maria Santos" error={errors.guestName?.message} {...register('guestName')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Telefone *" placeholder="+55 (48) 99999-0000" error={errors.guestPhone?.message} {...register('guestPhone')} />
                  <Input label="E-mail" placeholder="email@exemplo.com (opcional)" error={errors.guestEmail?.message} {...register('guestEmail')} />
                </div>
              </div>
            </>
          )}

          <div className="mt-4">
            <Textarea
              label="Observações / Pedidos especiais"
              placeholder="Ex: Quarto no andar térreo, berço extra..."
              rows={3}
              {...register('specialRequests')}
            />
          </div>
        </div>

        {/* Price preview */}
        {pricePreview && nights > 0 && (
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-3">Resumo do Preço</h2>
            <div className="space-y-2 text-sm">
              {hasCalendarPrices && watchCheckIn ? (
                <>
                  {/* Per-day breakdown from calendar */}
                  {Array.from({ length: nights }, (_, i) => {
                    const d = new Date(watchCheckIn);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const price = calendarDayPrices!.get(dateStr) ?? selectedProperty!.pricePerNight;
                    const isOverride = calendarDayPrices!.has(dateStr) && price !== selectedProperty!.pricePerNight;
                    return (
                      <div key={dateStr} className="flex justify-between">
                        <span className="text-neutral-500">
                          {dayLabel}
                          {isOverride && <span className="ml-1 text-xs text-amber-600 font-medium">(especial)</span>}
                        </span>
                        <span>{formatCurrency(price)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between border-t pt-2 mt-1">
                    <span className="text-neutral-500">Subtotal ({nights} noite{nights > 1 ? 's' : ''})</span>
                    <span>{formatCurrency(pricePreview.subtotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {formatCurrency(effectivePrice)} × {nights} noite{nights > 1 ? 's' : ''}
                    {watchCustomPrice && watchCustomPrice > 0 && watchCustomPrice !== selectedProperty?.pricePerNight && (
                      <span className="ml-1 text-xs text-amber-600 font-medium">(valor especial)</span>
                    )}
                  </span>
                  <span>{formatCurrency(pricePreview.subtotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Taxas (10%)</span>
                <span>{formatCurrency(pricePreview.taxes)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(pricePreview.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" type="button" onClick={() => navigate(ROUTES.DASHBOARD_BOOKINGS)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting || createBooking.isPending} disabled={!watchPropertyId || availabilityStatus === 'unavailable' || availabilityStatus === 'loading'}>
            Criar Reserva
          </Button>
        </div>
      </form>

      {/* ─── New Guest Modal ──────────────────────────────── */}
      <NewGuestModal
        isOpen={showNewGuestModal}
        onClose={() => setShowNewGuestModal(false)}
        onGuestCreated={handleGuestRegistered}
        initialName={searchQuery}
      />
    </div>
  );
}

// ─── New Guest Modal Component ──────────────────────────────
function NewGuestModal({
  isOpen, onClose, onGuestCreated, initialName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGuestCreated: (guest: SelectedGuest) => void;
  initialName?: string;
}) {
  const { error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewGuestFormData>({
    resolver: zodResolver(newGuestSchema) as Resolver<NewGuestFormData>,
    defaultValues: { name: initialName || '', email: '', phone: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: initialName || '', email: '', phone: '' });
    }
  }, [isOpen, initialName, reset]);

  const onSubmit = async (data: NewGuestFormData) => {
    setSubmitting(true);
    try {
      const [firstName, ...rest] = data.name.split(' ');
      const lastName = rest.join(' ') || firstName;
      const guestUser = await api.post<{
        id: string; email: string; firstName: string; lastName: string;
        fullName: string; phoneNumber?: string;
      }>('/auth/register-guest', {
        firstName,
        lastName,
        email: data.email,
        phoneNumber: data.phone,
      });
      onGuestCreated({
        id: guestUser.id,
        name: guestUser.fullName,
        email: guestUser.email,
        phone: guestUser.phoneNumber || data.phone,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao cadastrar hóspede');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cadastrar Novo Hóspede" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
        <p className="text-sm text-neutral-500 -mt-2 mb-2">
          O hóspede será cadastrado com uma senha gerada automaticamente.
          As credenciais e instruções serão enviadas por e-mail e WhatsApp.
        </p>
        <Input label="Nome completo *" placeholder="Ex: Maria Santos" error={errors.name?.message} {...register('name')} />
        <Input label="E-mail *" type="email" placeholder="email@exemplo.com" error={errors.email?.message} {...register('email')} />
        <Input label="Telefone (WhatsApp) *" placeholder="+55 (48) 99999-0000" error={errors.phone?.message} {...register('phone')} />
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={submitting} leftIcon={<UserPlus className="w-4 h-4" />}>
            Cadastrar e Selecionar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
