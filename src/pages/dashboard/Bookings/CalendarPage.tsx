import { useAuthStore } from '../../../store/auth.store';
import { useHostBookings } from '../../../hooks/useBookings';
import { Spinner } from '../../../components/ui/Spinner';
import { CalendarView } from './CalendarView';

export function BookingsCalendarPage() {
  const { user } = useAuthStore();
  const { data: bookings, isLoading } = useHostBookings(user?.id);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Calendário de Reservas</h1>
        <p className="text-sm text-neutral-500">
          {bookings?.length || 0} reserva{(bookings?.length || 0) !== 1 ? 's' : ''} no total
        </p>
      </div>
      <CalendarView bookings={bookings || []} />
    </div>
  );
}
