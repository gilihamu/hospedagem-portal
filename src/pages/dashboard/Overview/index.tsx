import { Link } from 'react-router-dom';
import { DollarSign, Calendar, Building2, Star, Plus, Phone, Percent, Wallet, TrendingUp, Moon } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useAnalyticsSummary, useRevenueData, useBookingsByChannel } from '../../../hooks/useAnalytics';
import { useHostBookings } from '../../../hooks/useBookings';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { StatCard } from '../../../components/shared/StatCard';
import { StatCardSkeleton } from '../../../components/shared/StatCardSkeleton';
import { BookingGrid } from '../../../components/dashboard/BookingGrid';
import { PropertyCalendarCard } from '../../../components/dashboard/PropertyCalendarCard';
import { TodayStrip } from '../../../components/dashboard/TodayStrip';
import { TodayMovement } from '../../../components/dashboard/TodayMovement';
import { RevenueOccupancyChart } from '../../../components/dashboard/RevenueOccupancyChart';
import { ChannelMixCard } from '../../../components/dashboard/ChannelMixCard';
import { OccupancyHeatmap } from '../../../components/dashboard/OccupancyHeatmap';
import { InsightCallouts } from '../../../components/dashboard/InsightCallouts';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { getTodayOps, getHotelKpis, getInsights } from '../../../utils/hotelMetrics';
import { ROUTES } from '../../../router/routes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const enter = (ms: number) => ({ animationDelay: `${ms}ms`, animationFillMode: 'backwards' as const });

export function OverviewPage() {
  const { user } = useAuthStore();
  const hostId = user?.role === 'host' ? user.id : undefined;
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(hostId);
  const { data: revenueData } = useRevenueData(hostId, 6);
  const { data: channelData } = useBookingsByChannel(hostId);
  const { data: bookings } = useHostBookings(user?.id);
  const { data: properties } = useOwnerProperties(user?.id);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const revenueSeries = revenueData?.map((d) => d.revenue);
  const bookingsSeries = revenueData?.map((d) => d.bookings);
  const propertyCount = properties?.length ?? 0;

  const ops = getTodayOps(bookings);
  const hotel = getHotelKpis(bookings, summary?.occupancyRate ?? 0);
  const insights = getInsights(revenueData, channelData);
  const hotelLoading = summaryLoading || !bookings;

  const ctxParts: string[] = [];
  if (ops.checkInsToday) ctxParts.push(`${ops.checkInsToday} check-in${ops.checkInsToday !== 1 ? 's' : ''}`);
  if (ops.checkOutsToday) ctxParts.push(`${ops.checkOutsToday} check-out${ops.checkOutsToday !== 1 ? 's' : ''}`);
  const greetingCtx = ctxParts.length ? `${ctxParts.join(' e ')} hoje` : null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-slide-up" style={enter(0)}>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Olá, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-neutral-500">
            <span className="capitalize">{today}</span>
            {greetingCtx && <span> · {greetingCtx}</span>}
          </p>
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

      {/* Faixa operacional do dia */}
      <div className="animate-slide-up" style={enter(60)}>
        <TodayStrip ops={ops} loading={!bookings} />
      </div>

      {/* KPIs de negócio */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up" style={enter(120)}>
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

      {/* KPIs hoteleiros */}
      <div className="space-y-3 animate-slide-up" style={enter(180)}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Desempenho hoteleiro</h2>
        {hotelLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Percent} label="Taxa de Ocupação" countTo={hotel.occupancy} format={(n) => `${Math.round(n)}%`} iconColor="text-info" />
            <StatCard icon={Wallet} label="Diária Média (ADR)" countTo={hotel.adr} format={formatCurrency} iconColor="text-primary" />
            <StatCard icon={TrendingUp} label="RevPAR" countTo={hotel.revpar} format={formatCurrency} iconColor="text-accent" />
            <StatCard icon={Moon} label="Permanência Média" countTo={hotel.los} format={(n) => `${n.toFixed(1)} noites`} iconColor="text-warning" />
          </div>
        )}
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="animate-slide-up" style={enter(220)}>
          <InsightCallouts insights={insights} />
        </div>
      )}

      {/* Booking Grid — Mapa de Reservas por Propriedade */}
      {properties && properties.length > 0 && bookings && (
        <div className="animate-slide-up" style={enter(260)}>
          <BookingGrid
            bookings={bookings}
            properties={properties.map(p => ({ id: p.id, name: p.name, pricePerNight: p.pricePerNight }))}
          />
        </div>
      )}

      {/* Gráfico Ocupação × Receita + Movimentação de hoje */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-slide-up" style={enter(300)}>
        <RevenueOccupancyChart hostId={hostId} bookings={bookings} propertyCount={propertyCount} />
        <TodayMovement ops={ops} />
      </div>

      {/* Mix de canais + Heatmap de ocupação */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-slide-up" style={enter(340)}>
        <ChannelMixCard hostId={hostId} />
        <OccupancyHeatmap bookings={bookings} propertyCount={propertyCount} />
      </div>

      {/* Property Calendars */}
      {properties && properties.length > 0 && (
        <div className="animate-slide-up" style={enter(380)}>
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
