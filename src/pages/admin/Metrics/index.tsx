import { Users, Home, CalendarCheck, DollarSign, UserPlus, CalendarPlus, TrendingUp, Activity, HeartPulse } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/admin.service';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { formatCurrency } from '../../../utils/formatters';
import type { SystemMetrics } from '../../../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="card-base p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{title}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

const healthBadge: Record<SystemMetrics['systemHealth'], 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
};

const healthLabels: Record<SystemMetrics['systemHealth'], string> = {
  healthy: 'Saudável',
  degraded: 'Degradado',
  down: 'Indisponível',
};

export function AdminMetricsPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => adminService.getMetrics(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Métricas do Sistema</h1>
        <p className="text-sm text-neutral-500">Visão geral da plataforma</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total de Usuários" value={metrics.totalUsers} icon={Users} color="bg-blue-500" />
        <MetricCard title="Total de Propriedades" value={metrics.totalProperties} icon={Home} color="bg-emerald-500" />
        <MetricCard title="Total de Reservas" value={metrics.totalBookings} icon={CalendarCheck} color="bg-violet-500" />
        <MetricCard title="Receita Total" value={formatCurrency(metrics.totalRevenue)} icon={DollarSign} color="bg-amber-500" />
      </div>

      {/* Today cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Novos Usuários Hoje" value={metrics.newUsersToday} icon={UserPlus} color="bg-sky-500" />
        <MetricCard title="Reservas Hoje" value={metrics.bookingsToday} icon={CalendarPlus} color="bg-indigo-500" />
        <MetricCard title="Receita Hoje" value={formatCurrency(metrics.revenueToday)} icon={TrendingUp} color="bg-orange-500" />
        <MetricCard title="Usuários Ativos (30d)" value={metrics.activeUsers30d} icon={Activity} color="bg-teal-500" />
      </div>

      {/* System Health */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-neutral-700" />
            <h2 className="text-lg font-semibold text-neutral-900">Saúde do Sistema</h2>
          </div>
          <Badge variant={healthBadge[metrics.systemHealth]}>{healthLabels[metrics.systemHealth]}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Serviço</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Latência</th>
              </tr>
            </thead>
            <tbody>
              {metrics.services.map((svc) => (
                <tr key={svc.name} className="border-b border-surface-border hover:bg-surface-muted/30">
                  <td className="px-4 py-3 font-medium text-neutral-800">{svc.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${svc.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-neutral-600">{svc.status === 'up' ? 'Online' : 'Offline'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{svc.latencyMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
