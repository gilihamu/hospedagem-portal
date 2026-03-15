import { useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/admin.service';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { formatDate } from '../../../utils/formatters';

const actionBadge: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  login: 'info',
  create_property: 'success',
  update_booking: 'primary',
  connect_channel: 'info',
  export_report: 'default',
  update_user_role: 'warning',
  create_business: 'success',
  delete_property: 'error',
};

function getActionBadgeVariant(action: string) {
  return actionBadge[action] || 'default';
}

function formatActionLabel(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
  });

  const filtered = (logs || []).filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource.toLowerCase().includes(q) ||
      (log.details?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Logs de Auditoria</h1>
        <p className="text-sm text-neutral-500">
          {logs?.length || 0} registro{(logs?.length || 0) !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Buscar por usuário, ação ou recurso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum log encontrado" description="Ajuste os filtros de busca." />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Recurso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Detalhes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-surface-border hover:bg-surface-muted/30">
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{log.userName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getActionBadgeVariant(log.action)}>{formatActionLabel(log.action)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{log.resource}</td>
                    <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-xs hidden md:table-cell">{log.ipAddress || '—'}</td>
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
