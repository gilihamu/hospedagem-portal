import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../utils/formatters';
import type { UserRole } from '../../../types';

const roleBadge: Record<UserRole, 'error' | 'primary' | 'default'> = {
  admin: 'error', host: 'primary', guest: 'default',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin', host: 'Anfitrião', guest: 'Hóspede',
};

const roleOptions = [
  { value: '', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'host', label: 'Anfitrião' },
  { value: 'guest', label: 'Hóspede' },
];

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.getAll(),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      userService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      success('Papel atualizado com sucesso!');
    },
    onError: () => showError('Erro ao atualizar papel'),
  });

  const filtered = (users || []).filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Usuários</h1>
        <p className="text-sm text-neutral-500">{users?.length || 0} usuário{(users?.length || 0) !== 1 ? 's' : ''} cadastrados</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Ajuste os filtros de busca." />
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Papel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Desde</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Alterar papel</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-surface-border hover:bg-surface-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <span className="font-medium text-neutral-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadge[u.role]}>{roleLabels[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.verified ? 'success' : 'warning'}>
                        {u.verified ? 'Verificado' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as UserRole })}
                        className="text-xs border border-surface-border rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-primary"
                      >
                        <option value="guest">Hóspede</option>
                        <option value="host">Anfitrião</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
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
