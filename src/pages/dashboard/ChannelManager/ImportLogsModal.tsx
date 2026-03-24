import { FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';
import { Badge } from '../../../components/ui/Badge';
import { useImportLogs } from '../../../hooks/useChannels';
import type { ChannelConnection, ChannelImportLog } from '../../../types';

interface Props {
  connection: ChannelConnection | null;
  channelName?: string;
  onClose: () => void;
}

export function ImportLogsModal({ connection, channelName, onClose }: Props) {
  const { data: logs, isLoading } = useImportLogs(connection?.id);

  if (!connection) return null;

  const getStatusIcon = (status: ChannelImportLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-danger" />;
    }
  };

  const getStatusBadge = (status: ChannelImportLog['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Sucesso</Badge>;
      case 'partial':
        return <Badge variant="warning">Parcial</Badge>;
      case 'error':
        return <Badge variant="error">Erro</Badge>;
    }
  };

  return (
    <Modal
      isOpen={!!connection}
      onClose={onClose}
      title={`Histórico de Importações - ${channelName}`}
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="py-12 text-center">
            <Spinner size="lg" />
          </div>
        )}

        {!isLoading && logs && logs.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">Nenhuma importação realizada ainda.</p>
          </div>
        )}

        {!isLoading && logs && logs.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
              >
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-neutral-800 capitalize">
                      {log.type === 'properties' ? 'Acomodações' : 'Reservas'}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <p className="text-sm text-neutral-600">
                    {log.itemsImported} {log.itemsImported === 1 ? 'item importado' : 'itens importados'}
                  </p>
                  {log.errorMessage && (
                    <p className="text-sm text-danger mt-1">{log.errorMessage}</p>
                  )}
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(log.startedAt).toLocaleString('pt-BR')}
                    {log.completedAt && (
                      <> • Duração: {Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
