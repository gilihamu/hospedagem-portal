import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, UserPlus, CalendarPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/auth.store';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { useCreateBooking } from '../../../hooks/useBookings';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/formatters';
import { differenceInDays } from '../../../utils/dates';
import { ROUTES } from '../../../router/routes';
import type { Booking } from '../../../types';

const schema = z.object({
  propertyId: z.string().min(1, 'Selecione uma propriedade'),
  guestName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  guestEmail: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  guestPhone: z.string().min(10, 'Telefone inválido'),
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

type FormData = z.infer<typeof schema>;

export function NewBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: properties, isLoading: loadingProps } = useOwnerProperties(user?.id);
  const createBooking = useCreateBooking();
  const { success, error: showError } = useToast();
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      propertyId: '',
      guests: 1,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
    },
  });

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

  const nights = useMemo(() => {
    if (watchCheckIn && watchCheckOut) {
      const n = differenceInDays(watchCheckOut, watchCheckIn);
      return n > 0 ? n : 0;
    }
    return 0;
  }, [watchCheckIn, watchCheckOut]);

  const pricePreview = useMemo(() => {
    if (!selectedProperty || nights <= 0) return null;
    const subtotal = effectivePrice * nights;
    const taxes = subtotal * 0.1;
    return { subtotal, taxes, total: subtotal + taxes };
  }, [selectedProperty, nights, effectivePrice]);

  const propertyOptions = useMemo(
    () => (properties || [])
      .filter(p => p.status === 'active')
      .map(p => ({ value: p.id, label: `${p.name} — ${p.address.city}` })),
    [properties],
  );

  const onSubmit = async (data: FormData) => {
    try {
      const booking = await createBooking.mutateAsync({
        propertyId: data.propertyId,
        guestId: user?.id || '',
        guestName: data.guestName,
        guestEmail: data.guestEmail || '',
        guestPhone: data.guestPhone,
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

  // ─── Confirmation screen ──────────────────────────────────
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
          <Button onClick={() => { setConfirmed(null); }}>
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
                  Deixe em branco para usar o preço padrão da propriedade. Preencha para aplicar um valor especial.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Guest info */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Dados do Hóspede
          </h2>
          <p className="text-xs text-neutral-400 mb-4">
            Informe os dados do hóspede. Se não estiver cadastrado, a reserva será criada com os dados informados.
          </p>
          <div className="space-y-4">
            <Input label="Nome completo *" placeholder="Ex: Maria Santos" error={errors.guestName?.message} {...register('guestName')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Telefone *" placeholder="+55 (48) 99999-0000" error={errors.guestPhone?.message} {...register('guestPhone')} />
              <Input label="E-mail" placeholder="email@exemplo.com (opcional)" error={errors.guestEmail?.message} {...register('guestEmail')} />
            </div>
            <Textarea
              label="Observações / Pedidos especiais"
              placeholder="Ex: Quarto no andar térreo, berço extra, alergia a travesseiro de pena..."
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
              <div className="flex justify-between">
                <span className="text-neutral-500">
                  {formatCurrency(effectivePrice)} × {nights} noite{nights > 1 ? 's' : ''}
                  {watchCustomPrice && watchCustomPrice > 0 && watchCustomPrice !== selectedProperty?.pricePerNight && (
                    <span className="ml-1 text-xs text-amber-600 font-medium">(valor especial)</span>
                  )}
                </span>
                <span>{formatCurrency(pricePreview.subtotal)}</span>
              </div>
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
          <Button type="submit" loading={isSubmitting || createBooking.isPending} disabled={!watchPropertyId}>
            Criar Reserva
          </Button>
        </div>
      </form>
    </div>
  );
}
