import { useState, useCallback } from 'react';
import {
  Users, Search, Download, Plus, Star, Ban,
  TrendingUp, UserCheck, Sparkles, ChevronLeft, ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  useGuests, useGuestStats, useCreateGuest, useUpdateGuest,
} from '../../../hooks/useGuests';
import { guestService } from '../../../services/guest.service';
import { useToast } from '../../../hooks/useToast';
import { GuestFormDrawer } from './GuestFormDrawer';
import { GuestDetailDrawer } from './GuestDetailDrawer';
import { GuestDetailPage } from './GuestDetailPage';
import type { Guest, GuestStats, SaveGuestData } from '../../../types';
import type { GuestFilters } from '../../../services/guest.service';

function StatCard({ label, value, colorClass, bgClass, Icon }: {
  label: string;
  value: string | number;
  colorClass: string;
  bgClass: string;
  Icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-4 flex flex-col items-center gap-1.5">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', bgClass)}>
        <Icon className={cn('w-4 h-4', colorClass)} />
      </div>
      <span className="text-base font-bold text-neutral-900">{value}</span>
      <span className="text-xs text-neutral-500">{label}</span>
    </div>
  );
}

function GuestStatsRow({ stats }: { stats: GuestStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Total" value={stats.totalGuests} colorClass="text-primary" bgClass="bg-primary/10" Icon={Users} />
      <StatCard label="VIPs" value={stats.vipCount} colorClass="text-amber-600" bgClass="bg-amber-100" Icon={Star} />
      <StatCard label="Bloqueados" value={stats.blacklistedCount} colorClass="text-red-600" bgClass="bg-red-100" Icon={Ban} />
      <StatCard label="Novos (mês)" value={stats.newThisMonth} colorClass="text-violet-600" bgClass="bg-violet-100" Icon={Sparkles} />
      <StatCard label="Recorrentes" value={`${stats.returnRate.toFixed(0)}%`} colorClass="text-green-600" bgClass="bg-green-100" Icon={TrendingUp} />
      <StatCard label="Receita Total" value={formatCurrency(stats.totalRevenue)} colorClass="text-blue-600" bgClass="bg-blue-100" Icon={UserCheck} />
    </div>
  );
}

type FilterTab = 'all' | 'vip' | 'blacklisted';

const PAGE_SIZE = 20;

export function GuestsPage() {
  const { success, error: showError } = useToast();

  const [filters, setFilters] = useState<GuestFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | undefined>();
  const [detailGuest, setDetailGuest] = useState<Guest | null>(null);
  const [exporting, setExporting] = useState(false);

  const queryFilters: GuestFilters = {
    ...filters,
    search: search || undefined,
    vip: activeTab === 'vip' ? true : undefined,
    blacklisted: activeTab === 'blacklisted' ? true : undefined,
  };

  const { data, isLoading } = useGuests(queryFilters);
  const { data: stats } = useGuestStats();
  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest(editGuest?.id ?? '');

  const handleSave = async (formData: SaveGuestData) => {
    try {
      if (editGuest) {
        const updated = await updateGuest.mutateAsync(formData);
        success('Hóspede atualizado!');
        if (detailGuest?.id === editGuest.id) setDetailGuest(updated);
      } else {
        await createGuest.mutateAsync(formData);
        success('Hóspede cadastrado!');
      }
      setFormOpen(false);
      setEditGuest(undefined);
    } catch {
      showError('Erro ao salvar hóspede.');
    }
  };

  const handleEdit = useCallback((guest: Guest) => {
    setEditGuest(guest);
    setFormOpen(true);
    setDetailGuest(null);
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      await guestService.exportCsv();
      success('Exportação concluída!');
    } catch {
      showError('Erro ao exportar.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;
  const page = filters.page ?? 1;

  if (detailGuest) {
    return (
      <GuestDetailPage
        guestId={detailGuest.id}
        onBack={() => setDetailGuest(null)}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Hóspedes</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gerencie todos os hóspedes vinculados ao seu estabelecimento
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} loading={exporting} onClick={handleExport}>
            Exportar CSV
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditGuest(undefined); setFormOpen(true); }}>
            Novo Hóspede
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && <GuestStatsRow stats={stats} />}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
            <select
              value={filters.sortBy ?? ''}
              onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value || undefined, page: 1 }))}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Ordenar por</option>
              <option value="name">Nome</option>
              <option value="created">Cadastro</option>
              <option value="stays">Estadias</option>
              <option value="spent">Gasto total</option>
              <option value="laststay">Última estadia</option>
            </select>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-1">
          {(['all', 'vip', 'blacklisted'] as FilterTab[]).map(id => {
            const labels: Record<FilterTab, string> = { all: 'Todos', vip: 'VIP', blacklisted: 'Bloqueados' };
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setFilters(f => ({ ...f, page: 1 })); }}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  activeTab === id ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {labels[id]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum hóspede encontrado"
            description={search ? 'Tente outros termos de busca.' : 'Cadastre seu primeiro hóspede.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
                    <th className="px-4 py-3 font-medium text-neutral-500">Hóspede</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 hidden md:table-cell">Contato</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 hidden lg:table-cell">Tags</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 text-center">Estadias</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 text-right hidden sm:table-cell">Gasto Total</th>
                    <th className="px-4 py-3 font-medium text-neutral-500 text-right hidden xl:table-cell">Última Estadia</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {data.items.map(g => (
                    <tr
                      key={g.id}
                      className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => setDetailGuest(g)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar initials */}
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            g.isVip ? 'bg-amber-100 text-amber-700' :
                            g.isBlacklisted ? 'bg-red-100 text-red-700' :
                            'bg-primary/10 text-primary'
                          )}>
                            {g.firstName[0]}{g.lastName?.[0] ?? ''}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-neutral-900">{g.fullName}</span>
                              {g.isVip && <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />}
                              {g.isBlacklisted && <Ban className="w-3 h-3 text-red-500" />}
                            </div>
                            <span className="text-xs text-neutral-400">{formatDate(g.createdAt)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {g.email && <p className="text-neutral-600 truncate max-w-[180px]">{g.email}</p>}
                          {g.phone && <p className="text-neutral-400">{g.phone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {g.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full capitalize">{t}</span>
                          ))}
                          {g.tags.length > 2 && (
                            <span className="text-xs text-neutral-400">+{g.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-block min-w-[2rem] text-center font-semibold rounded-full px-2 py-0.5 text-sm',
                          g.totalStays > 5 ? 'bg-green-100 text-green-700' :
                          g.totalStays > 0 ? 'bg-blue-50 text-blue-600' : 'text-neutral-400'
                        )}>
                          {g.totalStays}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell font-medium text-neutral-700">
                        {g.totalSpent > 0 ? formatCurrency(g.totalSpent) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell text-neutral-500">
                        {g.lastStayAt ? formatDate(g.lastStayAt) : '—'}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(g)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
                <span className="text-sm text-neutral-500">
                  {data.totalCount} hóspedes · Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setFilters(f => ({ ...f, page: p }))}
                        className={cn(
                          'w-8 h-8 text-sm rounded-lg',
                          p === page ? 'bg-primary text-white font-medium' : 'hover:bg-neutral-100 text-neutral-600'
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      <GuestDetailDrawer
        guest={detailGuest}
        open={!!detailGuest}
        onClose={() => setDetailGuest(null)}
        onEdit={handleEdit}
      />

      {/* Form Drawer */}
      <GuestFormDrawer
        guest={editGuest}
        open={formOpen}
        loading={createGuest.isPending || updateGuest.isPending}
        onClose={() => { setFormOpen(false); setEditGuest(undefined); }}
        onSave={handleSave}
      />
    </div>
  );
}
