import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GitBranch, Pencil, Trash2, Phone, Mail, User } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useBranches, useDeleteBranch, useUpdateBranch } from '../../../hooks/useBranches';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../router/routes';
import type { Branch } from '../../../types';
import { Spinner } from '../../../components/ui/Spinner';

export function BranchesPage() {
  const { user } = useAuthStore();
  const { data: branches, isLoading } = useBranches(user?.id);
  const { data: properties } = useOwnerProperties(user?.id);
  const deleteBranch = useDeleteBranch();
  const updateBranch = useUpdateBranch();
  const { success, error: showError } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  // Filter by owner's properties
  const ownerPropertyIds = new Set(properties?.map((p) => p.id) || []);
  const ownerBranches = branches?.filter((b) => ownerPropertyIds.has(b.propertyId)) || [];

  const getPropertyName = (propertyId: string) =>
    properties?.find((p) => p.id === propertyId)?.name || 'Propriedade';

  const handleToggleActive = async (branch: Branch) => {
    try {
      await updateBranch.mutateAsync({ id: branch.id, data: { active: !branch.active } });
      success(`Filial ${branch.active ? 'desativada' : 'ativada'}`);
    } catch {
      showError('Erro ao atualizar filial');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBranch.mutateAsync(deleteTarget.id);
      success('Filial removida');
      setDeleteTarget(null);
    } catch {
      showError('Erro ao remover filial');
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Filiais</h1>
          <p className="text-sm text-neutral-500">{ownerBranches.length} filial{ownerBranches.length !== 1 ? 'is' : ''}</p>
        </div>
        <Link to={ROUTES.DASHBOARD_BRANCHES_NEW}>
          <Button leftIcon={<Plus className="w-4 h-4" />}>Nova Filial</Button>
        </Link>
      </div>

      {ownerBranches.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Nenhuma filial ainda"
          description="Adicione filiais para gerenciar diferentes localizações de suas propriedades."
          action={{ label: 'Adicionar filial', onClick: () => {} }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ownerBranches.map((branch) => (
            <div key={branch.id} className="card-base p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-800">{branch.name}</h3>
                  <p className="text-sm text-primary">{getPropertyName(branch.propertyId)}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {branch.address.city}, {branch.address.state}
                  </p>
                </div>
                <Switch
                  checked={branch.active}
                  onChange={() => handleToggleActive(branch)}
                />
              </div>

              <div className="space-y-2 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{branch.manager}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate">{branch.email}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-surface-border">
                <Button variant="outline" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} className="flex-1">
                  Editar
                </Button>
                <button
                  onClick={() => setDeleteTarget(branch)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-error hover:bg-error-light transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remover filial"
        description={`Tem certeza que deseja remover "${deleteTarget?.name}"?`}
        confirmLabel="Remover"
        loading={deleteBranch.isPending}
      />
    </div>
  );
}
