import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useOwnerProperties, useUpdateProperty, useDeleteProperty } from '../../../hooks/useProperties';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ChannelBadge } from '../../../components/shared/ChannelBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/formatters';
import { ROUTES, editPropertyRoute } from '../../../router/routes';
import type { Property } from '../../../types';

const typeLabels: Record<string, string> = {
  hotel: 'Hotel', pousada: 'Pousada', hostel: 'Hostel',
  apartamento: 'Apartamento', resort: 'Resort', 'chalé': 'Chalé',
};

export function PropertiesPage() {
  const { user } = useAuthStore();
  const { data: properties, isLoading } = useOwnerProperties(user?.id);
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  const { success, error: showError } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const handleToggleStatus = async (property: Property) => {
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        data: { status: property.status === 'active' ? 'inactive' : 'active' },
      });
      success(`Propriedade ${property.status === 'active' ? 'desativada' : 'ativada'}`);
    } catch {
      showError('Erro ao atualizar status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProperty.mutateAsync(deleteTarget.id);
      success('Propriedade removida');
      setDeleteTarget(null);
    } catch {
      showError('Erro ao remover propriedade');
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Minhas Propriedades</h1>
          <p className="text-sm text-neutral-500">{properties?.length || 0} propriedade{(properties?.length || 0) !== 1 ? 's' : ''}</p>
        </div>
        <Link to={ROUTES.DASHBOARD_PROPERTY_NEW}>
          <Button leftIcon={<Plus className="w-4 h-4" />}>Nova Acomodação</Button>
        </Link>
      </div>

      {/* Table */}
      {!properties || properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma propriedade ainda"
          description="Adicione sua primeira propriedade para começar a receber reservas."
          action={{ label: 'Adicionar primeira propriedade', onClick: () => {} }}
        />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Propriedade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Origem</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Cidade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Preço/noite</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Avaliação</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => {
                  const primaryImg = prop.images.find((i) => i.isPrimary) || prop.images[0];
                  return (
                    <tr key={prop.id} className="border-b border-surface-border hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {primaryImg && (
                            <img
                              src={primaryImg.url}
                              alt={prop.name}
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <span className="font-medium text-neutral-800 truncate max-w-32 sm:max-w-none">{prop.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="default">{typeLabels[prop.type] || prop.type}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {prop.channelSource ? (
                          <ChannelBadge slug={prop.channelSource} />
                        ) : (
                          <span className="text-xs text-neutral-400">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell">{prop.address.city}</td>
                      <td className="px-4 py-3">
                        <Badge variant={prop.status === 'active' ? 'success' : prop.status === 'inactive' ? 'error' : 'warning'}>
                          {prop.status === 'active' ? 'Ativo' : prop.status === 'inactive' ? 'Inativo' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 hidden lg:table-cell">{formatCurrency(prop.pricePerNight)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-accent font-medium">★ {prop.rating.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={editPropertyRoute(prop.id)}>
                            <button className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/5 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(prop)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/5 transition-colors"
                            title={prop.status === 'active' ? 'Desativar' : 'Ativar'}
                          >
                            {prop.status === 'active'
                              ? <ToggleRight className="w-4 h-4 text-success" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => setDeleteTarget(prop)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-error hover:bg-error-light transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover propriedade"
        description={`Tem certeza que deseja remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        loading={deleteProperty.isPending}
      />
    </div>
  );
}
