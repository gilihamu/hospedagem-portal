import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import type { Property } from '../../types';
import { Button } from '../ui/Button';
import { GuestCounter } from './GuestCounter';
import { StarRating } from './StarRating';
import { Modal } from '../ui/Modal';
import { DateRangePicker } from '../ui/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { differenceInDays } from '../../utils/dates';
import { useBookingStore } from '../../store/booking.store';
import { useAuthStore } from '../../store/auth.store';
import { bookingRoute } from '../../router/routes';
import { ROUTES } from '../../router/routes';

interface BookingWidgetProps {
  property: Property;
}

export function BookingWidget({ property }: BookingWidgetProps) {
  const { isAuthenticated } = useAuthStore();
  const { checkIn, checkOut, guests, setDates, setGuests, setPropertyId } = useBookingStore();
  const navigate = useNavigate();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const nights = checkIn && checkOut ? Math.max(0, differenceInDays(checkOut, checkIn)) : 0;
  const subtotal = nights * property.pricePerNight;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + taxes;

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    setPropertyId(property.id);
    navigate(bookingRoute(property.id));
  };

  return (
    <div className="card-base p-5 sticky top-24">
      {/* Price header */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <span className="text-2xl font-bold text-primary">{formatCurrency(property.pricePerNight)}</span>
          <span className="text-neutral-400 text-sm"> /noite</span>
        </div>
        <div className="flex items-center gap-1">
          <StarRating rating={property.rating} size="sm" />
          <span className="text-sm text-neutral-500">({property.totalReviews})</span>
        </div>
      </div>

      {/* Date selector */}
      <div className="border border-surface-border rounded-xl overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="w-full grid grid-cols-2 divide-x divide-surface-border hover:bg-surface-muted transition-colors"
        >
          <div className="px-3 py-2 text-left">
            <p className="text-xs font-semibold text-neutral-500 mb-0.5">CHECK-IN</p>
            <p className="text-sm text-neutral-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              {checkIn ? formatDate(checkIn) : 'Selecionar'}
            </p>
          </div>
          <div className="px-3 py-2 text-left">
            <p className="text-xs font-semibold text-neutral-500 mb-0.5">CHECK-OUT</p>
            <p className="text-sm text-neutral-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              {checkOut ? formatDate(checkOut) : 'Selecionar'}
            </p>
          </div>
        </button>
        <div className="border-t border-surface-border px-3 py-2">
          <GuestCounter
            value={guests}
            onChange={setGuests}
            max={property.maxGuests}
            label="Hóspedes"
          />
        </div>
      </div>

      {/* Price breakdown */}
      {nights > 0 && (
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>{formatCurrency(property.pricePerNight)} × {nights} noite{nights > 1 ? 's' : ''}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>Taxas de serviço</span>
            <span>{formatCurrency(taxes)}</span>
          </div>
          <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-surface-border">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      <Button onClick={handleBook} fullWidth size="lg" className="mb-3">
        {isAuthenticated ? 'Reservar' : 'Entrar para reservar'}
      </Button>
      <p className="text-xs text-center text-neutral-400">Não é cobrado agora</p>

      {/* Calendar Modal */}
      <Modal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} title="Selecione as datas" size="lg">
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={(d) => setDates(d, checkOut || '')}
          onCheckOutChange={(d) => {
            setDates(checkIn || '', d);
            if (d) setCalendarOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
