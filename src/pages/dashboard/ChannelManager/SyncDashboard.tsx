import { useState } from 'react';
import { Activity, RefreshCw, Copy, CheckCircle2, AlertCircle, Clock, ArrowUpDown, Webhook } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useSyncLogs, useTriggerFullSync, usePullReservations } from '../../../hooks/useBookingCom';
import type { SyncLogEntry } from '../../../types';

interface Props {
  propertyChannelId?: string;
  hotelCode?: string;
}

export function SyncDashboard({ propertyChannelId, hotelCode }: Props) {
  const { data: logs, isLoading } = useSyncLogs(propertyChannelId);
  const syncMutation = useTriggerFullSync();
  const pullMutation = usePullReservations();
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/booking-com/webhook/reservations`;

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFullSync = async () => {
    if (!hotelCode) return;
    await syncMutation.mutateAsync({ hotelCode, propertyChannelId });
  };

  const handlePullReservations = async () => {
    if (!hotelCode || !propertyChannelId) return;
    await pullMutation.mutateAsync({ hotelCode, propertyChannelId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Success':
        return <Badge variant="success">Sucesso</Badge>;
      case 'Failed':
        return <Badge variant="error">Falhou</Badge>;
      case 'InProgress':
        return <Badge variant="warning">Em andamento</Badge>;
      case 'PartialSuccess':
        return <Badge variant="warning">Parcial</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getSyncTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      property: 'Propriedade',
      rates: 'Tarifas',
      availability: 'Disponibilidade',
      reservations: 'Reservas',
      content: 'Conteúdo',
      full_sync: 'Sync Completo',
    };
    return labels[type] || type;
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}min`;
  };

  if (!propertyChannelId) {
    return (
      <div className="card-base p-8 text-center text-neutral-500">
        Selecione uma propriedade para ver os logs de sincronização.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div className="card-base p-6">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <Webhook className="w-5 h-5 text-primary" />
          Webhook URL
        </h3>
        <p className="text-sm text-neutral-500 mb-3">
          Configure esta URL no Booking.com Extranet para receber reservas em tempo real.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-neutral-50 border rounded-lg px-4 py-2.5 text-sm text-neutral-700 font-mono truncate">
            {webhookUrl}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopyWebhook}>
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="card-base p-6">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-primary" />
          Ações de Sincronização
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleFullSync}
            loading={syncMutation.isPending}
            disabled={!hotelCode}
          >
            <ArrowUpDown className="w-4 h-4 mr-1" />
            Sync Completo
          </Button>
          <Button
            variant="outline"
            onClick={handlePullReservations}
            loading={pullMutation.isPending}
            disabled={!hotelCode}
          >
            <Activity className="w-4 h-4 mr-1" />
            Puxar Reservas
          </Button>
        </div>

        {syncMutation.data && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Sync concluído em {syncMutation.data.duration}
            {syncMutation.data.errors.length > 0 && (
              <span className="text-yellow-600">
                ({syncMutation.data.errors.length} erro{syncMutation.data.errors.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sync Logs */}
      <div className="card-base overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Logs de Sincronização
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            Nenhum log de sincronização encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Direção</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Registros</th>
                  <th className="px-4 py-3 font-medium">Duração</th>
                  <th className="px-4 py-3 font-medium">Início</th>
                  <th className="px-4 py-3 font-medium">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log: SyncLogEntry) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {getSyncTypeLabel(log.syncType)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={log.direction === 'push' ? 'default' : 'warning'}>
                        {log.direction === 'push' ? '↑ Push' : '↓ Pull'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-600">{log.recordsSucceeded}</span>
                      {log.recordsFailed > 0 && (
                        <span className="text-red-500"> / {log.recordsFailed} ✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDuration(log.startedAt, log.completedAt)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(log.startedAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {log.errorMessage && (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">{log.errorMessage}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
