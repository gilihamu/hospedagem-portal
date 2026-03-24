import { useState } from 'react';
import { CheckCircle, XCircle, Building2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../../../services/property.service';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/formatters';
import type { PropertyStatus } from '../../../types';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'pending', label: 'Pendente' },
];

const typeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'resort', label: 'Resort' },
  { value: 'chalé', label: 'Chalé' },
];

const typeLabels: Record<string, string> = {
  hotel: 'Hotel', pousada: 'Pousada', hostel: 'Hostel',
  apartamento: 'Apartamento', resort: 'Resort', 'chalé': 'Chalé',
};

export function AdminPropertiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => propertyService.getAllForAdmin(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyStatus }) =>
      Promise.resolve(propertyService.updateStatus(id, status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      success('Status atualizado!');
    },
    onError: () => showError('Erro ao atualizar status'),
  });

  const filtered = (properties || []).filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchType = !typeFilter || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Propriedades</h1>
        <p className="text-sm text-neutral-500">{properties?.length || 0} propriedades na plataforma</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44" />
        <Select options={typeOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-40" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhuma propriedade encontrada" description="Ajuste os filtros." />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Propriedade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Proprietário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Cidade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">Cadastro</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const img = p.images.find((i) => i.isPrimary) || p.images[0];
                  return (
                    <tr key={p.id} className="border-b border-surface-border hover:bg-surface-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {img && <img src={img.url} alt={p.name} className="w-10 h-8 object-cover rounded-lg flex-shrink-0" />}
                          <span className="font-medium text-neutral-800 truncate max-w-32">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{p.ownerName}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="default">{typeLabels[p.type] || p.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{p.address.city}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'active' ? 'success' : p.status === 'pending' ? 'warning' : 'error'}>
                          {p.status === 'active' ? 'Ativo' : p.status === 'pending' ? 'Pendente' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 hidden xl:table-cell">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus.mutate({ id: p.id, status: 'active' })}
                                className="p-1.5 rounded-lg text-success hover:bg-success-light transition-colors"
                                title="Aprovar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus.mutate({ id: p.id, status: 'inactive' })}
                                className="p-1.5 rounded-lg text-error hover:bg-error-light transition-colors"
                                title="Rejeitar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {p.status === 'active' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: p.id, status: 'inactive' })}
                              className="p-1.5 rounded-lg text-error hover:bg-error-light transition-colors"
                              title="Desativar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {p.status === 'inactive' && (
                            <button
                              onClick={() => updateStatus.mutate({ id: p.id, status: 'active' })}
                              className="p-1.5 rounded-lg text-success hover:bg-success-light transition-colors"
                              title="Ativar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
