import { Link } from 'react-router-dom';
import { DollarSign, Calendar, Building2, Star, Plus, BarChart3, Phone, CalendarPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../../store/auth.store';
import { useAnalyticsSummary, useRevenueData } from '../../../hooks/useAnalytics';
import { useHostBookings } from '../../../hooks/useBookings';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { StatCard } from '../../../components/shared/StatCard';
import { StatCardSkeleton } from '../../../components/shared/StatCardSkeleton';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { BookingGrid } from '../../../components/dashboard/BookingGrid';
import { PropertyCalendarCard } from '../../../components/dashboard/PropertyCalendarCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatDate, formatNumber } from '../../../utils/formatters';
import { ROUTES } from '../../../router/routes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const enter = (ms: number) => ({ animationDelay: `${ms}ms`, animationFillMode: 'backwards' as const });

function RevenueChartSkeleton() {
  const bars = [55, 72, 48, 84, 63, 92];
  return (
    <div className="flex items-end justify-between gap-3 h-[220px] px-2 pt-4">
      {bars.map((h, i) => (
        <Skeleton key={i} width="100%" height={`${h}%`} className="rounded-t-md rounded-b-none" />
      ))}
    </div>
  );
}

export function OverviewPage() {
  const { user } = useAuthStore();
  const hostId = user?.role === 'host' ? user.id : undefined;
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(hostId);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData(hostId, 6);
  const { data: bookings } = useHostBookings(user?.id);
  const { data: properties } = useOwnerProperties(user?.id);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const recentBookings = bookings?.slice(0, 5) || [];
  const revenueSeries = revenueData?.map((d) => d.revenue);
  const bookingsSeries = revenueData?.map((d) => d.bookings);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-slide-up" style={enter(0)}>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Olá, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-neutral-500 capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.DASHBOARD_BOOKINGS_NEW}>
            <Button leftIcon={<Phone className="w-4 h-4" />} size="sm">Nova Reserva</Button>
          </Link>
          <Link to={ROUTES.DASHBOARD_PROPERTY_NEW}>
            <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} size="sm">Nova Propriedade</Button>
          </Link>
          <Link to={ROUTES.DASHBOARD_BOOKINGS}>
            <Button variant="ghost" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>Ver Reservas</Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up" style={enter(80)}>
          <StatCard
            icon={DollarSign}
            label="Receita Total"
            countTo={summary.totalRevenue}
            format={formatCurrency}
            growth={summary.revenueGrowth}
            iconColor="text-success"
            series={revenueSeries}
          />
          <StatCard
            icon={Calendar}
            label="Total de Reservas"
            countTo={summary.totalBookings}
            format={formatNumber}
            growth={summary.bookingsGrowth}
            iconColor="text-primary"
            series={bookingsSeries}
          />
          <StatCard
            icon={Building2}
            label="Propriedades Ativas"
            countTo={summary.activeProperties}
            format={formatNumber}
            iconColor="text-accent"
          />
          <StatCard
            icon={Star}
            label="Avaliação Média"
            countTo={summary.averageRating}
            format={(n) => `${n.toFixed(1)}★`}
            iconColor="text-warning"
          />
        </div>
      )}

      {/* Booking Grid — Mapa de Reservas por Propriedade */}
      {properties && properties.length > 0 && bookings && (
        <div className="animate-slide-up" style={enter(140)}>
          <BookingGrid
            bookings={bookings}
            properties={properties.map(p => ({ id: p.id, name: p.name, pricePerNight: p.pricePerNight }))}
          />
        </div>
      )}

      {/* Charts + Recent Bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-slide-up" style={enter(200)}>
        {/* Revenue Chart */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Receita dos últimos 6 meses
          </h2>
          {revenueLoading ? (
            <RevenueChartSkeleton />
          ) : revenueData && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(typeof v === 'number' ? v : 0), 'Receita']} />
                <Bar dataKey="revenue" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent bookings */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-800">Reservas recentes</h2>
            <Link to={ROUTES.DASHBOARD_BOOKINGS} className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3">
                  <CalendarPlus className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-700">Nenhuma reserva ainda</p>
                <p className="text-xs text-neutral-400 mb-3">Crie a primeira para começar a acompanhar</p>
                <Link to={ROUTES.DASHBOARD_BOOKINGS_NEW}>
                  <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />}>Nova reserva</Button>
                </Link>
              </div>
            ) : recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg border-b border-surface-border last:border-0 transition-colors hover:bg-surface-muted">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{b.guestName}</p>
                  <p className="text-xs text-neutral-400 truncate">{b.propertyName} · {formatDate(b.checkIn)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <BookingStatusBadge status={b.status} />
                  <span className="text-sm font-semibold text-primary tabular-nums hidden sm:block">{formatCurrency(b.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Property Calendars */}
      {properties && properties.length > 0 && (
        <div className="animate-slide-up" style={enter(260)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Calendários das Propriedades
            </h2>
            <Link to={ROUTES.DASHBOARD_PROPERTIES} className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {properties.map((p) => (
              <PropertyCalendarCard key={p.id} propertyId={p.id} propertyName={p.name} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
