import { useState } from 'react';
import { Link2, Plus, RefreshCw, Settings, History, AlertCircle, CheckCircle2, Trash2, Download, Calendar, Shield, Building2, Activity } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { Switch } from '../../../components/ui/Switch';
import { Select } from '../../../components/ui/Select';
import { useChannels, useChannelConnections, useDisconnectChannel, useImportProperties, useImportBookings, useSyncChannel, useUpdateSyncSettings } from '../../../hooks/useChannels';
import { ConnectChannelModal } from './ConnectChannelModal';
import { ImportLogsModal } from './ImportLogsModal';
import { CredentialsPanel } from './CredentialsPanel';
import { PropertyMappingsPanel } from './PropertyMappingsPanel';
import { ReservationsFeed } from './ReservationsFeed';
import { SyncDashboard } from './SyncDashboard';
import type { ChannelConnection, Channel } from '../../../types';

const BUSINESS_ID = 'biz1'; // Demo business

type Tab = 'connections' | 'credentials' | 'properties' | 'reservations' | 'sync';

export function ChannelManagerPage() {
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: connections, isLoading: connectionsLoading } = useChannelConnections(BUSINESS_ID);
  
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [settingsConnection, setSettingsConnection] = useState<ChannelConnection | null>(null);
  const [logsConnection, setLogsConnection] = useState<ChannelConnection | null>(null);
  const [disconnectConnection, setDisconnectConnection] = useState<ChannelConnection | null>(null);
  const [selectedPropertyChannelId] = useState<string | undefined>(undefined);
  const [selectedHotelCode] = useState<string | undefined>(undefined);

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'connections', label: 'Conexões', icon: <Link2 className="w-4 h-4" /> },
    { id: 'credentials', label: 'Credenciais', icon: <Shield className="w-4 h-4" /> },
    { id: 'properties', label: 'Propriedades', icon: <Building2 className="w-4 h-4" /> },
    { id: 'reservations', label: 'Reservas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync & Logs', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Gerenciador de Canais</h1>
          <p className="text-neutral-500 mt-1">
            Conecte plataformas de hospedagem, sincronize propriedades e gerencie reservas de todos os canais.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'connections' && (
        <div className="space-y-8">
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
                  return (
                    <div key={conn.id} className="card-base p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: channel.color }}
                          >
                            {channel.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-800">{channel.name}</h3>
                            <p className="text-xs text-neutral-500">{conn.accountEmail || conn.accountId || 'Conectado'}</p>
                          </div>
                        </div>
                        <Badge variant={conn.syncStatus === 'error' ? 'error' : 'success'}>
                          {conn.syncStatus === 'error' ? 'Erro' : 'Ativo'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                        <div className="bg-neutral-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-neutral-800">{conn.importedPropertiesCount}</p>
                          <p className="text-xs text-neutral-500">Propriedades</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-neutral-800">{conn.importedBookingsCount}</p>
                          <p className="text-xs text-neutral-500">Reservas</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-2">
                          <p className="text-xs font-medium text-neutral-800 mt-1">
                            {conn.lastSyncAt
                              ? new Date(conn.lastSyncAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                              : 'Nunca'}
                          </p>
                          <p className="text-xs text-neutral-500">Último sync</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleSync(conn.id)} loading={syncMutation.isPending}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sincronizar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleImportProperties(conn.id)}>
                          <Download className="w-3.5 h-3.5 mr-1" /> Propriedades
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleImportBookings(conn.id)}>
                          <Calendar className="w-3.5 h-3.5 mr-1" /> Reservas
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSettingsConnection(conn)}>
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setLogsConnection(conn)}>
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDisconnectConnection(conn)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Available Channels */}
          {availableChannels.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Canais Disponíveis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableChannels.map((channel) => (
                  <div key={channel.slug} className="card-base p-5 flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: channel.color }}
                      >
                        {channel.name.charAt(0)}
                      </div>
                      <h3 className="font-semibold text-neutral-800">{channel.name}</h3>
                    </div>
                    <p className="text-sm text-neutral-500 flex-1 mb-4">{channel.description}</p>
                    <Button variant="outline" onClick={() => handleOpenConnect(channel)} className="w-full">
                      <Link2 className="w-4 h-4 mr-1" />
                      Conectar
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === 'credentials' && <CredentialsPanel />}
      {activeTab === 'properties' && <PropertyMappingsPanel />}
      {activeTab === 'reservations' && <ReservationsFeed propertyChannelId={selectedPropertyChannelId} />}
      {activeTab === 'sync' && <SyncDashboard propertyChannelId={selectedPropertyChannelId} hotelCode={selectedHotelCode} />}

      {/* Modals */}
      <ConnectChannelModal
        open={connectModalOpen}
        channel={selectedChannel}
        onClose={() => { setConnectModalOpen(false); setSelectedChannel(null); }}
        businessId={BUSINESS_ID}
      />

      {logsConnection && (
        <ImportLogsModal
          connection={logsConnection}
          channelName={getChannelInfo(logsConnection.channelSlug)?.name || ''}
          onClose={() => setLogsConnection(null)}
        />
      )}

      {/* Settings Modal */}
      {settingsConnection && (
        <Modal isOpen={!!settingsConnection} onClose={() => setSettingsConnection(null)} title={`Configurações — ${getChannelInfo(settingsConnection.channelSlug)?.name}`}>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-800">Sync automático</p>
                <p className="text-sm text-neutral-500">Sincronizar automaticamente em intervalos regulares</p>
              </div>
              <Switch
                checked={settingsConnection.autoSync}
                onChange={(checked: boolean) => handleUpdateSettings(settingsConnection.id, { autoSync: checked })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Intervalo de sincronização</label>
              <Select
                value={String(settingsConnection.syncIntervalHours)}
                onChange={(val) => handleUpdateSettings(settingsConnection.id, { syncIntervalHours: Number(val) })}
                options={[
                  { value: '1', label: 'A cada hora' },
                  { value: '3', label: 'A cada 3 horas' },
                  { value: '6', label: 'A cada 6 horas' },
                  { value: '12', label: 'A cada 12 horas' },
                  { value: '24', label: 'A cada 24 horas' },
                ]}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Disconnect Confirmation */}
      {disconnectConnection && (
        <Modal isOpen={!!disconnectConnection} onClose={() => setDisconnectConnection(null)} title="Desconectar Canal">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Tem certeza que deseja desconectar <strong>{getChannelInfo(disconnectConnection.channelSlug)?.name}</strong>?
              Reservas existentes não serão afetadas.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisconnectConnection(null)}>Cancelar</Button>
              <Button variant="outline" onClick={handleDisconnect} loading={disconnectMutation.isPending} className="text-red-600 border-red-300 hover:bg-red-50">
                Desconectar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
