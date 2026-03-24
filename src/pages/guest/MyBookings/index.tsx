import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, MapPin, Clock, Users, Search,
  ChevronRight, Luggage, Filter, CalendarCheck,
} from 'lucide-react';
import { format, parseISO, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { bookingService } from '../../../services/booking.service';
import { useAuthStore } from '../../../store/auth.store';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency } from '../../../utils/formatters';
import type { Booking } from '../../../types';

type TabFilter = 'all' | 'upcoming' | 'active' | 'past' | 'cancelled';

const TABS: { key: TabFilter; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todas', icon: CalendarDays },
  { key: 'upcoming', label: 'Próximas', icon: CalendarCheck },
  { key: 'active', label: 'Em andamento', icon: Luggage },
  { key: 'past', label: 'Concluídas', icon: Clock },
  { key: 'cancelled', label: 'Canceladas', icon: Filter },
];

function classifyBooking(b: Booking): TabFilter {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'completed') return 'past';
  const checkIn = parseISO(b.checkIn);
  const checkOut = parseISO(b.checkOut);
  if ((isToday(checkIn) || isPast(checkIn)) && isFuture(checkOut)) return 'active';
  if (isFuture(checkIn)) return 'upcoming';
  return 'past';
}

export function MyBookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    bookingService
      .getByGuest(user.id)
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = bookings
    .filter((b) => tab === 'all' || classifyBooking(b) === tab)
    .filter(
      (b) =>
        !search ||
        b.propertyName.toLowerCase().includes(search.toLowerCase()) ||
        b.confirmationCode.toLowerCase().includes(search.toLowerCase()) ||
        b.propertyCity.toLowerCase().includes(search.toLowerCase())
    );

  const counts = bookings.reduce(
    (acc, b) => {
      acc.all++;
      acc[classifyBooking(b)]++;
      return acc;
    },
    { all: 0, upcoming: 0, active: 0, past: 0, cancelled: 0 } as Record<TabFilter, number>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <Luggage className="w-6 h-6 text-primary" />
                Minhas Reservas
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {bookings.length} reserva{bookings.length !== 1 ? 's' : ''} no total
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código, cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  tab === key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {counts[key] > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab === key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-9 h-9 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-1">Nenhuma reserva encontrada</h3>
            <p className="text-sm text-neutral-500 mb-6">
              {search
                ? 'Tente buscar com outros termos.'
                : 'Você ainda não possui reservas nesta categoria.'}
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition"
            >
              <Search className="w-4 h-4" />
              Buscar hospedagens
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Booking Card ═══ */
function BookingCard({ booking }: { booking: Booking }) {
  const classification = classifyBooking(booking);
  const isActive = classification === 'active';

  return (
    <Link
      to={`/my-bookings/${booking.id}`}
      className={`block bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-200 group ${
        isActive ? 'border-primary/30 ring-1 ring-primary/10' : 'border-neutral-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
          <img
            src={booking.propertyImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
            alt={booking.propertyName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {isActive && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                EM ANDAMENTO
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-neutral-900 text-lg truncate group-hover:text-primary transition-colors">
                  {booking.propertyName}
                </h3>
                <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {booking.propertyCity}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {/* Dates & Details */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-neutral-400" />
                {format(parseISO(booking.checkIn), "dd MMM", { locale: ptBR })} → {format(parseISO(booking.checkOut), "dd MMM yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-400" />
                {booking.guests} hóspede{booking.guests !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
            <div>
              <span className="text-xs text-neutral-400">Código</span>
              <p className="text-sm font-mono font-semibold text-neutral-700">{booking.confirmationCode}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-primary">{formatCurrency(booking.totalPrice)}</span>
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
