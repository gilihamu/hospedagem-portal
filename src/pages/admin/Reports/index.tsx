import { DollarSign, Calendar, Users, Building2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAnalyticsSummary, useRevenueData, useOccupancyData } from '../../../hooks/useAnalytics';
import { StatCard } from '../../../components/shared/StatCard';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency } from '../../../utils/formatters';
import { mockUsers } from '../../../mocks/data';

// Mock user registration data
const userGrowthData = [
  { month: 'Set/25', users: 1 },
  { month: 'Out/25', users: 2 },
  { month: 'Nov/25', users: 3 },
  { month: 'Dez/25', users: 4 },
  { month: 'Jan/26', users: 5 },
  { month: 'Fev/26', users: 5 },
  { month: 'Mar/26', users: 5 },
];

// Mock city data
const cityData = [
  { city: 'São Paulo', bookings: 4 },
  { city: 'Rio de Janeiro', bookings: 3 },
  { city: 'Florianópolis', bookings: 2 },
  { city: 'Gramado', bookings: 2 },
  { city: 'Porto Seguro', bookings: 2 },
  { city: 'Fortaleza', bookings: 1 },
];

export function AdminReportsPage() {
  const { data: summary, isLoading } = useAnalyticsSummary();
  const { data: revenueData } = useRevenueData(undefined, 12);
  const { data: occupancyData } = useOccupancyData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Relatórios</h1>
        <p className="text-sm text-neutral-500">Análise completa da plataforma</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(summary.totalRevenue)} growth={summary.revenueGrowth} iconColor="text-success" />
          <StatCard icon={Calendar} label="Total de Reservas" value={summary.totalBookings} growth={summary.bookingsGrowth} iconColor="text-primary" />
          <StatCard icon={Users} label="Total de Usuários" value={mockUsers.length} iconColor="text-info" />
          <StatCard icon={Building2} label="Propriedades Ativas" value={summary.activeProperties} iconColor="text-accent" />
        </div>
      )}

      {/* Revenue LineChart */}
      <div className="card-base p-5">
        <h2 className="font-semibold text-neutral-800 mb-4">Receita mensal (12 meses)</h2>
        {revenueData && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(typeof v === 'number' ? v : 0), 'Receita']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#1E3A5F" strokeWidth={2} name="Receita" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="bookings" stroke="#D4A017" strokeWidth={2} name="Reservas" yAxisId={1} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bookings by city */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Reservas por cidade</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#D4A017" radius={[0, 4, 4, 0]} name="Reservas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User growth */}
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Crescimento de usuários</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={userGrowthData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#2563EB" fill="#DBEAFE" name="Usuários" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Occupancy */}
      {occupancyData && occupancyData.length > 0 && (
        <div className="card-base p-5">
          <h2 className="font-semibold text-neutral-800 mb-4">Taxa de ocupação por propriedade</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={occupancyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="property" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [typeof v === 'number' ? `${v}%` : '0%', 'Ocupação']} />
              <Bar dataKey="occupancy" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Ocupação %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
