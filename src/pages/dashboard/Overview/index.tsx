import { Link } from 'react-router-dom';
import { DollarSign, Calendar, Building2, Star, Plus, BarChart3, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../../store/auth.store';
import { useAnalyticsSummary, useRevenueData } from '../../../hooks/useAnalytics';
import { useHostBookings } from '../../../hooks/useBookings';
import { StatCard } from '../../../components/shared/StatCard';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { ROUTES } from '../../../router/routes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function OverviewPage() {
  const { user } = useAuthStore();
  const hostId = user?.role === 'host' ? user.id : undefined;
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(hostId);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData(hostId, 6);
  const { data: bookings } = useHostBookings(user?.id);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const recentBookings = bookings?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
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
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Receita Total"
            value={formatCurrency(summary.totalRevenue)}
            growth={summary.revenueGrowth}
            iconColor="text-success"
          />
          <StatCard
            icon={Calendar}
            label="Total de Reservas"
            value={summary.totalBookings}
            growth={summary.bookingsGrowth}
            iconColor="text-primary"
          />
          <StatCard
            icon={Building2}
            label="Propriedades Ativas"
            value={summary.activeProperties}
            iconColor="text-accent"
          />
          <StatCard
            icon={Star}
            label="Avaliação Média"
            value={`${summary.averageRating}★`}
            iconColor="text-warning"
          />
        </div>
      )}

      {/* Charts + Recent Bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Receita dos últimos 6 meses
          </h2>
          {revenueLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
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
              <p className="text-sm text-neutral-400 text-center py-8">Nenhuma reserva ainda</p>
            ) : recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{b.guestName}</p>
                  <p className="text-xs text-neutral-400 truncate">{b.propertyName} · {formatDate(b.checkIn)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <BookingStatusBadge status={b.status} />
                  <span className="text-sm font-semibold text-primary hidden sm:block">{formatCurrency(b.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
