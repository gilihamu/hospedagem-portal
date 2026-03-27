import { useState } from 'react';
import { Building2, RefreshCw, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useBookingComProperties, useTriggerFullSync } from '../../../hooks/useBookingCom';
import type { PropertyStatusResult } from '../../../types';

export function PropertyMappingsPanel() {
  const { data: properties, isLoading, refetch, isFetching } = useBookingComProperties();
  const syncMutation = useTriggerFullSync();
  const [syncingHotel, setSyncingHotel] = useState<string | null>(null);

  const handleSync = async (hotelCode: string) => {
    setSyncingHotel(hotelCode);
    try {
      await syncMutation.mutateAsync({ hotelCode });
    } finally {
      setSyncingHotel(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="default">Desconhecido</Badge>;
    const lower = status.toLowerCase();
    if (lower.includes('open') || lower.includes('bookable'))
      return <Badge variant="success">Ativo</Badge>;
    if (lower.includes('building') || lower.includes('pending'))
      return <Badge variant="warning">Em configuração</Badge>;
    return <Badge variant="error">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="card-base p-6 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Propriedades na Booking.com
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {!properties || properties.length === 0 ? (
        <div className="p-12 text-center">
          <Globe className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            Nenhuma propriedade encontrada na Booking.com.
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            Verifique suas credenciais ou cadastre propriedades no Extranet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b text-sm text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Hotel</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Score</th>
                <th className="px-4 py-3 font-medium">Conexão</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {properties.map((prop: PropertyStatusResult) => (
                <tr key={prop.hotelCode} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-neutral-800">{prop.hotelName}</p>
                      <p className="text-xs text-neutral-400">{prop.currencyCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <code className="text-sm bg-neutral-100 px-2 py-1 rounded">
                      {prop.hotelCode}
                    </code>
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(prop.hotelStatus)}</td>
                  <td className="px-4 py-4 text-center">
                    {prop.contentScore != null ? (
                      <div className="flex items-center justify-center gap-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            prop.contentScore >= 80
                              ? 'bg-green-100 text-green-700'
                              : prop.contentScore >= 50
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {prop.contentScore}
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {prop.connections.length > 0 ? (
                      <div className="space-y-1">
                        {prop.connections.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            {c.connectionState === 'active' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                            )}
                            <span className="text-neutral-600">{c.connectionType}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">Sem conexão XML</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(prop.hotelCode)}
                      disabled={syncingHotel === prop.hotelCode}
                    >
                      {syncingHotel === prop.hotelCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="ml-1">Sync</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
