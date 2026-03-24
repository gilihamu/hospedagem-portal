import { useState } from 'react';
import { DollarSign, Calendar, BarChart3, Star, Download, Users, TrendingUp, Sparkles } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuthStore } from '../../../store/auth.store';
import {
  useAnalyticsSummary, useRevenueData, useOccupancyData,
  useTopProperties, useBookingsByChannel,
} from '../../../hooks/useAnalytics';
import { useGuestAnalytics } from '../../../hooks/useGuests';
import { analyticsService } from '../../../services/analytics.service';
import { StatCard } from '../../../components/shared/StatCard';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { Select } from '../../../components/ui/Select';

const monthOptions = [
  { value: '3', label: 'Últimos 3 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Últimos 12 meses' },
];

const NATIONALITY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

export function AnalyticsPage() {
  const { user } = useAuthStore();
  const hostId = user?.role === 'host' ? user.id : undefined;
  const [months, setMonths] = useState(6);
  const [exporting, setExporting] = useState(false);
  const { success, error: showError } = useToast();

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(hostId);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData(hostId, months);
  const { data: occupancyData } = useOccupancyData(hostId);
  const { data: topProperties } = useTopProperties(hostId);
  const { data: channelData } = useBookingsByChannel(hostId);
  const { data: guestAnalytics } = useGuestAnalytics();

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await analyticsService.exportReport('csv', hostId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-hospedabr-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Relatório exportado com sucesso!');
    } catch {
      showError('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Analytics</h1>
          <p className="text-sm text-neutral-500">Acompanhe o desempenho das suas propriedades</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            loading={exporting}
            onClick={handleExport}
          >
            Exportar
          </Button>
          <Select
            options={monthOptions}
            value={String(months)}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      {summaryLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(summary.totalRevenue)} growth={summary.revenueGrowth} iconColor="text-success" />
          <StatCard icon={Calendar} label="Total de Reservas" value={summary.totalBookings} growth={summary.bookingsGrowth} iconColor="text-primary" />
          <StatCard icon={BarChart3} label="Taxa de Ocupação" value={formatPercent(summary.occupancyRate)} iconColor="text-accent" />
          <StatCard icon={Star} label="Avaliação Média" value={`${summary.averageRating}★`} iconColor="text-warning" />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="card-base p-5">
        <h2 className="font-semibold text-neutral-800 mb-4">Receita mensal</h2>
        {revenueLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : revenueData && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatCurrency(typeof v === 'number' ? v : 0), 'Receita']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#1E3A5F" strokeWidth={2} dot={{ r: 4 }} name="Receita" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Channel breakdown + Occupancy side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Channel */}
        {channelData && channelData.length > 0 && (
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-4">Reservas por canal</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="channel"
                  >
                    {channelData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} reservas`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {channelData.map((ch) => (
                <div key={ch.channel} className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                  {ch.channel} ({ch.count})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occupancy Chart */}
        {occupancyData && occupancyData.length > 0 && (
          <div className="card-base p-5">
            <h2 className="font-semibold text-neutral-800 mb-4">Taxa de ocupação por propriedade</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={occupancyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="property" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? `${v}%` : '0%', 'Ocupação']} />
                <Bar dataKey="occupancy" fill="#D4A017" radius={[4, 4, 0, 0]} name="Ocupação %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top properties */}
      {topProperties && topProperties.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="p-5 border-b border-surface-border">
            <h2 className="font-semibold text-neutral-800">Propriedades com melhor desempenho</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Propriedade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reservas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Receita</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Avaliação</th>
              </tr>
            </thead>
            <tbody>
              {topProperties.map((prop) => (
                <tr key={prop.id} className="border-b border-surface-border hover:bg-surface-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-800">{prop.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{prop.bookingCount}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(prop.revenue)}</td>
                  <td className="px-4 py-3 text-accent font-medium">★ {prop.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Guest Analytics ── */}
      {guestAnalytics && (
        <>
          <div className="border-t border-surface-border pt-6 mt-2">
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Analytics de Hóspedes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total de Hóspedes" value={guestAnalytics.totalGuests} iconColor="text-primary" />
            <StatCard icon={Star} label="VIPs" value={guestAnalytics.vipCount} iconColor="text-warning" />
            <StatCard icon={TrendingUp} label="Taxa de Retorno" value={formatPercent(guestAnalytics.returnRate / 100)} iconColor="text-success" />
            <StatCard icon={Sparkles} label="Novos este Mês" value={guestAnalytics.newThisMonth} iconColor="text-accent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly new guests chart */}
            {guestAnalytics.monthlyNewGuests.length > 0 && (
              <div className="card-base p-5">
                <h2 className="font-semibold text-neutral-800 mb-4">Novos hóspedes por mês</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={guestAnalytics.monthlyNewGuests} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Novos']} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hóspedes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Nationality distribution */}
            {guestAnalytics.nationalityDistribution.length > 0 && (
              <div className="card-base p-5">
                <h2 className="font-semibold text-neutral-800 mb-4">Distribuição por nacionalidade</h2>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={guestAnalytics.nationalityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="nationality"
                      >
                        {guestAnalytics.nationalityDistribution.map((_, idx) => (
                          <Cell key={idx} fill={NATIONALITY_COLORS[idx % NATIONALITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} (${guestAnalytics.nationalityDistribution.find(n => n.nationality === name)?.percentage ?? 0}%)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {guestAnalytics.nationalityDistribution.map((n, idx) => (
                    <div key={n.nationality} className="flex items-center gap-1.5 text-xs text-neutral-600">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: NATIONALITY_COLORS[idx % NATIONALITY_COLORS.length] }} />
                      {n.nationality} ({n.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top spenders table */}
          {guestAnalytics.topSpenders.length > 0 && (
            <div className="card-base overflow-hidden">
              <div className="p-5 border-b border-surface-border">
                <h2 className="font-semibold text-neutral-800">Top 10 — Hóspedes que mais gastaram</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-surface-border bg-surface-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hóspede</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estadias</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Gasto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {guestAnalytics.topSpenders.map((g) => (
                    <tr key={g.id} className="border-b border-surface-border hover:bg-surface-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-neutral-800">{g.fullName}</td>
                      <td className="px-4 py-3 text-neutral-600">{g.totalStays}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(g.totalSpent)}</td>
                      <td className="px-4 py-3">
                        {g.isVip && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⭐ VIP</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
