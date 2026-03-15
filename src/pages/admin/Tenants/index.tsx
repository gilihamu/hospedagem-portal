import { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/admin.service';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '../../../utils/formatters';
import type { Tenant } from '../../../types';

const planBadge: Record<Tenant['plan'], 'default' | 'info' | 'primary' | 'success'> = {
  free: 'default',
  starter: 'info',
  professional: 'primary',
  enterprise: 'success',
};

const planLabels: Record<Tenant['plan'], string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const statusBadge: Record<Tenant['status'], 'success' | 'warning' | 'error'> = {
  active: 'success',
  suspended: 'warning',
  cancelled: 'error',
};

const statusLabels: Record<Tenant['status'], string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  cancelled: 'Cancelado',
};

export function AdminTenantsPage() {
  const [search, setSearch] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: () => adminService.getTenants(),
  });

  const filtered = (tenants || []).filter((t) => {
    return (
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.ownerName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Tenants</h1>
        <p className="text-sm text-neutral-500">
          {tenants?.length || 0} tenant{(tenants?.length || 0) !== 1 ? 's' : ''} cadastrados
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhum tenant encontrado" description="Ajuste os filtros de busca." />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Proprietário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Propriedades</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Usuários</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-surface-border hover:bg-surface-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} size="sm" />
                        <span className="font-medium text-neutral-800">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{t.ownerName || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={planBadge[t.plan]}>{planLabels[t.plan]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{t.propertiesCount}</td>
                    <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{t.usersCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[t.status]}>{statusLabels[t.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
