import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Calendar, Users, MapPin, ChevronLeft, MessageSquare } from 'lucide-react';
import { useProperty } from '../../../hooks/useProperties';
import { useCreateBooking } from '../../../hooks/useBookings';
import { useBookingStore } from '../../../store/booking.store';
import { useAuthStore } from '../../../store/auth.store';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { GuestCounter } from '../../../components/shared/GuestCounter';
import { DateRangePicker } from '../../../components/ui/DateRangePicker';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { differenceInDays } from '../../../utils/dates';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../router/routes';
import type { Booking } from '../../../types';

const guestSchema = z.object({
  guestName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  guestEmail: z.string().email('E-mail inválido'),
  guestPhone: z.string().min(10, 'Telefone inválido'),
  specialRequests: z.string().optional(),
});

type GuestFormData = z.infer<typeof guestSchema>;

const steps = [
  { id: 1, label: 'Datas' },
  { id: 2, label: 'Informações' },
  { id: 3, label: 'Revisão' },
  { id: 4, label: 'Confirmação' },
];

export function BookingPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { user } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();
  const [step, setStep] = useState(1);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const {
    checkIn, checkOut, guests,
    guestName, guestEmail, guestPhone, specialRequests,
    setDates, setGuests, setGuestInfo, clearBooking,
  } = useBookingStore();

  const { data: property, isLoading } = useProperty(propertyId || '');
  const createBooking = useCreateBooking();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      guestName: user?.name || guestName,
      guestEmail: user?.email || guestEmail,
      guestPhone: user?.phone || guestPhone,
      specialRequests: specialRequests,
    },
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!property) return <div className="container-app py-16 text-center"><p>Propriedade não encontrada</p></div>;

  const nights = checkIn && checkOut ? Math.max(0, differenceInDays(checkOut, checkIn)) : 0;
  const subtotal = nights * property.pricePerNight;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + taxes;

  const handleGuestSubmit = (data: GuestFormData) => {
    setGuestInfo(data);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!user || !checkIn || !checkOut) return;
    try {
      const booking = await createBooking.mutateAsync({
        propertyId: property.id,
        guestId: user.id,
        guestName: guestName || user.name,
        guestEmail: guestEmail || user.email,
        guestPhone: guestPhone || user.phone || '',
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests || undefined,
      });
      setConfirmedBooking(booking);
      setStep(4);
      clearBooking();
      showSuccess('Reserva criada com sucesso!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao criar reserva');
    }
  };

  // Step 4: Confirmation
  if (step === 4 && confirmedBooking) {
    return (
      <div className="container-app max-w-lg py-12 text-center">
        <div className="w-20 h-20 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reserva confirmada!</h1>
        <p className="text-neutral-500 mb-6">Sua reserva foi criada com sucesso.</p>

        <div className="card-base p-5 mb-6 text-left">
          <p className="text-xs text-neutral-400 mb-1">Código de confirmação</p>
          <p className="text-xl font-bold text-primary font-mono">{confirmedBooking.confirmationCode}</p>
          <div className="border-t border-surface-border mt-4 pt-4 space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-neutral-500">Propriedade:</span> <span className="font-medium">{confirmedBooking.propertyName}</span></p>
            <p className="flex justify-between"><span className="text-neutral-500">Check-in:</span> <span className="font-medium">{formatDate(confirmedBooking.checkIn)}</span></p>
            <p className="flex justify-between"><span className="text-neutral-500">Check-out:</span> <span className="font-medium">{formatDate(confirmedBooking.checkOut)}</span></p>
            <p className="flex justify-between"><span className="text-neutral-500">Total:</span> <span className="font-bold text-primary">{formatCurrency(confirmedBooking.totalPrice)}</span></p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={ROUTES.MESSAGES} className="flex-1">
            <Button variant="outline" fullWidth leftIcon={<MessageSquare className="w-4 h-4" />}>
              Ir para mensagens
            </Button>
          </Link>
          <Link to={ROUTES.HOME} className="flex-1">
            <Button fullWidth>
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app max-w-2xl py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.filter(s => s.id < 4).map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.id ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? 'text-primary' : 'text-neutral-400'}`}>{s.label}</span>
              {s.id < 3 && <div className={`hidden sm:block h-px flex-1 w-16 mx-2 ${step > s.id ? 'bg-primary' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Property summary */}
      <div className="card-base p-4 flex gap-4 mb-6">
        {property.images[0] && (
          <img
            src={property.images[0].url}
            alt={property.name}
            className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-neutral-800 truncate">{property.name}</h2>
          <p className="text-sm text-neutral-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {property.address.city}, {property.address.state}
          </p>
          {nights > 0 && (
            <p className="text-sm font-semibold text-primary mt-1">
              {formatCurrency(total)} · {nights} noite{nights > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Step 1: Dates & Guests */}
      {step === 1 && (
        <div className="card-base">
          <div className="p-5 border-b border-surface-border">
            <h2 className="font-bold text-neutral-800">Datas e hóspedes</h2>
          </div>
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={(d) => setDates(d, checkOut || '')}
            onCheckOutChange={(d) => setDates(checkIn || '', d)}
          />
          <div className="p-5 border-t border-surface-border">
            <GuestCounter
              value={guests}
              onChange={setGuests}
              max={property.maxGuests}
              label={`Hóspedes (máx. ${property.maxGuests})`}
            />
            <Button
              fullWidth
              size="lg"
              className="mt-4"
              disabled={!checkIn || !checkOut || nights <= 0}
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Guest Info */}
      {step === 2 && (
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-neutral-800">Informações do hóspede</h2>
          </div>

          <form onSubmit={handleSubmit(handleGuestSubmit)} className="space-y-4">
            <Input label="Nome completo" error={errors.guestName?.message} {...register('guestName')} />
            <Input label="E-mail" type="email" error={errors.guestEmail?.message} {...register('guestEmail')} />
            <Input label="Telefone" placeholder="(11) 99999-9999" error={errors.guestPhone?.message} {...register('guestPhone')} />
            <Textarea
              label="Pedidos especiais (opcional)"
              placeholder="Alguma preferência ou necessidade especial?"
              rows={3}
              {...register('specialRequests')}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Continuar</Button>
          </form>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep(2)} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-neutral-800">Revisão da reserva</h2>
          </div>

          <div className="space-y-4 text-sm mb-6">
            <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="font-medium">{checkIn && formatDate(checkIn)} → {checkOut && formatDate(checkOut)}</p>
                <p className="text-neutral-500">{nights} noite{nights > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg">
              <Users className="w-4 h-4 text-primary" />
              <p className="font-medium">{guests} hóspede{guests > 1 ? 's' : ''}</p>
            </div>

            <div className="border-t border-surface-border pt-4 space-y-2">
              <div className="flex justify-between text-neutral-600">
                <span>{formatCurrency(property.pricePerNight)} × {nights} noites</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Taxas de serviço (10%)</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900 border-t border-surface-border pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleConfirm}
            loading={createBooking.isPending}
          >
            Confirmar Reserva
          </Button>
          <p className="text-xs text-center text-neutral-400 mt-2">Não é cobrado agora</p>
        </div>
      )}
    </div>
  );
}
