import { useState } from 'react';
import { Link2, Plus, RefreshCw, Settings, History, AlertCircle, CheckCircle2, Loader2, Trash2, Download, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { Switch } from '../../../components/ui/Switch';
import { Select } from '../../../components/ui/Select';
import { useChannels, useChannelConnections, useDisconnectChannel, useImportProperties, useImportBookings, useSyncChannel, useUpdateSyncSettings } from '../../../hooks/useChannels';
import { ConnectChannelModal } from './ConnectChannelModal';
import { ImportLogsModal } from './ImportLogsModal';
import type { ChannelConnection, Channel } from '../../../types';

const BUSINESS_ID = 'biz1'; // Demo business

export function ChannelManagerPage() {
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: connections, isLoading: connectionsLoading } = useChannelConnections(BUSINESS_ID);
  
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [settingsConnection, setSettingsConnection] = useState<ChannelConnection | null>(null);
  const [logsConnection, setLogsConnection] = useState<ChannelConnection | null>(null);
  const [disconnectConnection, setDisconnectConnection] = useState<ChannelConnection | null>(null);

  const disconnectMutation = useDisconnectChannel();
  const importPropertiesMutation = useImportProperties();
  const importBookingsMutation = useImportBookings();
  const syncMutation = useSyncChannel();
  const updateSettingsMutation = useUpdateSyncSettings();

  const isLoading = channelsLoading || connectionsLoading;

  const connectedChannelSlugs = new Set(
    connections?.filter(c => c.status === 'connected').map(c => c.channelSlug) || []
  );

  const availableChannels = channels?.filter(ch => !connectedChannelSlugs.has(ch.slug)) || [];
  const connectedChannels = connections?.filter(c => c.status === 'connected') || [];

  const getChannelInfo = (slug: string) => channels?.find(ch => ch.slug === slug);

  const handleOpenConnect = (channel: Channel) => {
    setSelectedChannel(channel);
    setConnectModalOpen(true);
  };

  const handleDisconnect = async () => {
    if (!disconnectConnection) return;
    await disconnectMutation.mutateAsync(disconnectConnection.id);
    setDisconnectConnection(null);
  };

  const handleImportProperties = async (connectionId: string) => {
    await importPropertiesMutation.mutateAsync(connectionId);
  };

  const handleImportBookings = async (connectionId: string) => {
    await importBookingsMutation.mutateAsync(connectionId);
  };

  const handleSync = async (connectionId: string) => {
    await syncMutation.mutateAsync(connectionId);
  };

  const handleUpdateSettings = async (connectionId: string, settings: { autoSync?: boolean; syncIntervalHours?: number }) => {
    await updateSettingsMutation.mutateAsync({ connectionId, settings });
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-neutral-800">Gerenciador de Canais</h1>
          <p className="text-neutral-500 mt-1">
            Conecte suas contas de plataformas de hospedagem e importe automaticamente suas acomodações e reservas.
          </p>
        </div>
      </div>

      {/* Connected Channels */}
      {connectedChannels.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Canais Conectados ({connectedChannels.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {connectedChannels.map((conn) => {
              const channel = getChannelInfo(conn.channelSlug);
              if (!channel) return null;

              const isSyncing = syncMutation.isPending && syncMutation.variables === conn.id;
              const isImportingProps = importPropertiesMutation.isPending && importPropertiesMutation.variables === conn.id;
              const isImportingBookings = importBookingsMutation.isPending && importBookingsMutation.variables === conn.id;

              return (
                <div
                  key={conn.id}
                  className="card-base p-5 border-l-4"
                  style={{ borderLeftColor: channel.color }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: channel.color }}
                      >
                        {channel.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-800">{channel.name}</h3>
                        <p className="text-sm text-neutral-500">{conn.accountEmail}</p>
                      </div>
                    </div>
                    <Badge variant={conn.syncStatus === 'error' ? 'error' : 'success'}>
                      {conn.syncStatus === 'error' ? 'Erro' : 'Conectado'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-neutral-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{conn.importedPropertiesCount}</p>
                      <p className="text-xs text-neutral-500">Acomodações</p>
                    </div>
                    <div className="text-center border-x border-neutral-200">
                      <p className="text-2xl font-bold text-accent">{conn.importedBookingsCount}</p>
                      <p className="text-xs text-neutral-500">Reservas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 mb-1">Última Sync</p>
                      <p className="text-sm font-medium text-neutral-700">
                        {conn.lastSyncAt 
                          ? new Date(conn.lastSyncAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : 'Nunca'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImportProperties(conn.id)}
                      disabled={isImportingProps}
                    >
                      {isImportingProps ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      Importar Acomodações
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImportBookings(conn.id)}
                      disabled={isImportingBookings}
                    >
                      {isImportingBookings ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-1" />
                      )}
                      Importar Reservas
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSync(conn.id)}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLogsConnection(conn)}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSettingsConnection(conn)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      onClick={() => setDisconnectConnection(conn)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Channels */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Conectar Novo Canal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableChannels.map((channel) => (
            <button
              key={channel.slug}
              type="button"
              onClick={() => handleOpenConnect(channel)}
              className="card-base p-5 text-left hover:shadow-lg transition-all group border-2 border-transparent hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: channel.color }}
                >
                  {channel.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 group-hover:text-primary transition-colors">
                    {channel.name}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                    {channel.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Clique para conectar</span>
                <Link2 className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}

          {availableChannels.length === 0 && (
            <div className="col-span-full text-center py-8 text-neutral-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
              <p className="font-medium">Todos os canais disponíveis já estão conectados!</p>
            </div>
          )}
        </div>
      </section>

      {/* Tips Section */}
      <section className="card-base p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Dicas para Integração
        </h3>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span>Certifique-se de que sua conta nas plataformas tenha permissões de API ou acesso de parceiro.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span>A sincronização automática mantém suas acomodações e reservas sempre atualizadas.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span>Você pode desconectar um canal a qualquer momento sem perder os dados já importados.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span>Configure o intervalo de sincronização conforme a frequência de atualizações que você precisa.</span>
          </li>
        </ul>
      </section>

      {/* Connect Channel Modal */}
      <ConnectChannelModal
        open={connectModalOpen}
        channel={selectedChannel}
        onClose={() => {
          setConnectModalOpen(false);
          setSelectedChannel(null);
        }}
        businessId={BUSINESS_ID}
      />

      {/* Settings Modal */}
      {settingsConnection && (
        <Modal
          isOpen={!!settingsConnection}
          onClose={() => setSettingsConnection(null)}
          title={`Configurações - ${getChannelInfo(settingsConnection.channelSlug)?.name}`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="font-medium text-neutral-800">Sincronização Automática</p>
                <p className="text-sm text-neutral-500">Importar automaticamente novas acomodações e reservas</p>
              </div>
              <Switch
                checked={settingsConnection.autoSync}
                onChange={(checked) => {
                  handleUpdateSettings(settingsConnection.id, { autoSync: checked });
                  setSettingsConnection({ ...settingsConnection, autoSync: checked });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Intervalo de Sincronização
              </label>
              <Select
                value={settingsConnection.syncIntervalHours.toString()}
                onChange={(e) => {
                  const hours = parseInt(e.target.value);
                  handleUpdateSettings(settingsConnection.id, { syncIntervalHours: hours });
                  setSettingsConnection({ ...settingsConnection, syncIntervalHours: hours });
                }}
                options={[
                  { value: '1', label: 'A cada 1 hora' },
                  { value: '3', label: 'A cada 3 horas' },
                  { value: '6', label: 'A cada 6 horas' },
                  { value: '12', label: 'A cada 12 horas' },
                  { value: '24', label: 'A cada 24 horas' },
                ]}
              />
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Conta conectada:</strong> {settingsConnection.accountEmail}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Conectado em {new Date(settingsConnection.connectedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setSettingsConnection(null)}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Logs Modal */}
      <ImportLogsModal
        connection={logsConnection}
        channelName={logsConnection ? getChannelInfo(logsConnection.channelSlug)?.name : undefined}
        onClose={() => setLogsConnection(null)}
      />

      {/* Disconnect Confirmation Modal */}
      {disconnectConnection && (
        <Modal
          isOpen={!!disconnectConnection}
          onClose={() => setDisconnectConnection(null)}
          title="Desconectar Canal"
        >
          <div className="space-y-4">
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-danger font-medium">
                Tem certeza que deseja desconectar {getChannelInfo(disconnectConnection.channelSlug)?.name}?
              </p>
              <p className="text-sm text-neutral-600 mt-2">
                Os dados já importados serão mantidos, mas a sincronização automática será interrompida.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDisconnectConnection(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Desconectar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
