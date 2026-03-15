import { Users, Building2, Calendar, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAnalyticsSummary, useRevenueData } from '../../../hooks/useAnalytics';
import { StatCard } from '../../../components/shared/StatCard';
import { BookingStatusBadge } from '../../../components/shared/BookingStatusBadge';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { mockUsers, mockBookings } from '../../../mocks/data';

export function AdminOverviewPage() {
  const { data: summary, isLoading } = useAnalyticsSummary();
  const { data: revenueData } = useRevenueData(undefined, 6);

  const recentUsers = mockUsers.slice(0, 4);
  const recentBookings = mockBookings.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Painel Administrativo</h1>
        <p className="text-sm text-neutral-500">Visão geral de toda a plataforma</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total de Usuários" value={mockUsers.length} iconColor="text-info" />
          <StatCard icon={Building2} label="Total de Propriedades" value={8} iconColor="text-accent" />
          <StatCard icon={Calendar} label="Total de Reservas" value={summary.totalBookings} growth={summary.bookingsGrowth} iconColor="text-primary" />
          <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(summary.totalRevenue)} growth={summary.revenueGrowth} iconColor="text-success" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Receita dos últimos 6 meses</h2>
          {revenueData && (
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

        {/* Recent users */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Usuários recentes</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{u.name}</p>
                  <p className="text-xs text-neutral-400">{u.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  u.role === 'admin' ? 'bg-error-light text-error-dark' :
                  u.role === 'host' ? 'bg-primary/10 text-primary' :
                  'bg-neutral-100 text-neutral-600'
                }`}>
                  {u.role === 'admin' ? 'Admin' : u.role === 'host' ? 'Anfitrião' : 'Hóspede'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card-base overflow-hidden">
        <div className="p-5 border-b border-surface-border">
          <h2 className="font-semibold text-neutral-800">Reservas recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Hóspede</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Propriedade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Check-in</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-surface-border hover:bg-surface-muted/30">
                  <td className="px-4 py-3 font-medium text-neutral-800">{b.guestName}</td>
                  <td className="px-4 py-3 text-neutral-600 hidden md:table-cell truncate max-w-32">{b.propertyName}</td>
                  <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell">{formatDate(b.checkIn)}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(b.totalPrice)}</td>
                  <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
