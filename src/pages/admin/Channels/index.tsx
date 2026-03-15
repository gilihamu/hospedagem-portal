import { useState } from 'react';
import { Link2, Search, Settings2, RefreshCw, CheckCircle2, AlertCircle, BarChart3, Building2, Calendar, Download, MoreVertical } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Spinner } from '../../../components/ui/Spinner';
import { useChannels, useChannelConnections } from '../../../hooks/useChannels';
import type { ChannelConnection, Channel } from '../../../types';

export function AdminChannelsPage() {
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'error'>('all');

  // Demo: Fetch connections for all businesses (in production, this would be a single API call)
  const { data: connections1 } = useChannelConnections('biz1');
  const { data: connections2 } = useChannelConnections('biz2');
  
  const allConnections: ChannelConnection[] = [
    ...(connections1 || []),
    ...(connections2 || []),
  ];

  const getChannelInfo = (slug: string): Channel | undefined => 
    channels?.find(ch => ch.slug === slug);

  // Stats
  const stats = {
    totalConnections: allConnections.length,
    activeConnections: allConnections.filter(c => c.status === 'connected').length,
    errorConnections: allConnections.filter(c => c.syncStatus === 'error').length,
    totalImported: allConnections.reduce((sum, c) => sum + c.importedPropertiesCount + c.importedBookingsCount, 0),
  };

  // Filtered connections
  const filteredConnections = allConnections.filter(conn => {
    const channel = getChannelInfo(conn.channelSlug);
    const matchesSearch = channel?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          conn.accountEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'connected' && conn.status === 'connected') ||
                          (statusFilter === 'error' && conn.syncStatus === 'error');
    return matchesSearch && matchesStatus;
  });

  // Channel usage stats
  const channelStats = channels?.map(ch => ({
    ...ch,
    connections: allConnections.filter(c => c.channelSlug === ch.slug).length,
    properties: allConnections.filter(c => c.channelSlug === ch.slug).reduce((sum, c) => sum + c.importedPropertiesCount, 0),
    bookings: allConnections.filter(c => c.channelSlug === ch.slug).reduce((sum, c) => sum + c.importedBookingsCount, 0),
  })) || [];

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Integrações de Canais</h1>
          <p className="text-neutral-500 mt-1">
            Visualize e gerencie todas as conexões de canais de hospedagem da plataforma.
          </p>
        </div>
        <Button variant="outline">
          <Settings2 className="w-4 h-4 mr-2" />
          Configurações Globais
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.totalConnections}</p>
              <p className="text-sm text-neutral-500">Conexões Totais</p>
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.activeConnections}</p>
              <p className="text-sm text-neutral-500">Ativas</p>
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.errorConnections}</p>
              <p className="text-sm text-neutral-500">Com Erro</p>
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{stats.totalImported}</p>
              <p className="text-sm text-neutral-500">Itens Importados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Overview */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Visão Geral por Canal
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {channelStats.map((ch) => (
            <div 
              key={ch.slug}
              className="card-base p-4 text-center"
              style={{ borderTop: `3px solid ${ch.color}` }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-2"
                style={{ backgroundColor: ch.color }}
              >
                {ch.name.charAt(0)}
              </div>
              <p className="font-medium text-neutral-800 text-sm mb-2">{ch.name}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Conexões:</span>
                  <span className="font-medium text-neutral-700">{ch.connections}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Imóveis:</span>
                  <span className="font-medium text-neutral-700">{ch.properties}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Reservas:</span>
                  <span className="font-medium text-neutral-700">{ch.bookings}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connections Table */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">
          Todas as Conexões
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por canal ou email..."
              prefixIcon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === 'connected' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('connected')}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Ativas
            </Button>
            <Button
              variant={statusFilter === 'error' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('error')}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Com Erro
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Canal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Conta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 inline" /> Imóveis
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    <Calendar className="w-4 h-4 inline" /> Reservas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Última Sync
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredConnections.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                      Nenhuma conexão encontrada.
                    </td>
                  </tr>
                )}
                {filteredConnections.map((conn) => {
                  const channel = getChannelInfo(conn.channelSlug);
                  
                  return (
                    <tr key={conn.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: channel?.color }}
                          >
                            {channel?.name.charAt(0)}
                          </div>
                          <span className="font-medium text-neutral-800">{channel?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600 text-sm">
                        {conn.accountEmail || '—'}
                      </td>
                      <td className="px-4 py-4">
                        {conn.status === 'connected' && conn.syncStatus !== 'error' ? (
                          <Badge variant="success">Conectado</Badge>
                        ) : conn.syncStatus === 'error' ? (
                          <Badge variant="error">Erro</Badge>
                        ) : (
                          <Badge variant="warning">Desconectado</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-neutral-800">
                        {conn.importedPropertiesCount}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-neutral-800">
                        {conn.importedBookingsCount}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-500">
                        {conn.lastSyncAt 
                          ? new Date(conn.lastSyncAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* API Health */}
      <section className="card-base p-6">
        <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Status das APIs de Integração
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {channels?.map((ch) => (
            <div key={ch.slug} className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-neutral-700">{ch.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
