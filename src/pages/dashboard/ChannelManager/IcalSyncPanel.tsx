import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownToLine, ArrowUpFromLine, Copy, Check, Info } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useOwnerProperties } from '../../../hooks/useProperties';
import { channelService } from '../../../services/channel.service';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';

function PropertyIcalRow({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const queryClient = useQueryClient();
  const { success } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['ical-config', propertyId],
    queryFn: () => channelService.getIcalConfig(propertyId),
  });

  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const importUrl = draft ?? data?.importUrl ?? '';
  const exportUrl = data ? `${window.location.origin}${data.exportUrl}` : '';

  const save = useMutation({
    mutationFn: (value: string) => channelService.setIcalImportUrl(propertyId, value),
    onSuccess: () => {
      success('URL de importação salva');
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ['ical-config', propertyId] });
    },
  });

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <div className="card-base p-5 space-y-4">
      <h3 className="font-semibold text-neutral-800">{propertyName}</h3>
      {isLoading ? (
        <div className="py-4 flex justify-center"><Spinner /></div>
      ) : (
        <>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1">
              <ArrowDownToLine className="w-4 h-4 text-info" /> Importar da Airbnb
            </label>
            <p className="text-xs text-neutral-400 mb-2">
              Cole o link "Exportar calendário" do seu anúncio na Airbnb — as datas ocupadas lá bloqueiam aqui.
            </p>
            <div className="flex gap-2">
              <input
                className="input-base flex-1"
                placeholder="https://www.airbnb.com/calendar/ical/...ics"
                value={importUrl}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button size="sm" onClick={() => save.mutate(importUrl)} loading={save.isPending}>Salvar</Button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1">
              <ArrowUpFromLine className="w-4 h-4 text-success" /> Exportar para a Airbnb
            </label>
            <p className="text-xs text-neutral-400 mb-2">
              Cadastre este link na Airbnb ("Importar calendário") — reservas e bloqueios daqui fecham a data lá.
            </p>
            <div className="flex gap-2">
              <input className="input-base flex-1 text-neutral-500" readOnly value={exportUrl} onFocus={(e) => e.target.select()} />
              <Button size="sm" variant="outline" onClick={copyExport}>
                {copied ? <><Check className="w-3.5 h-3.5 mr-1" />Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copiar</>}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function IcalSyncPanel() {
  const { user } = useAuthStore();
  const { data: properties, isLoading } = useOwnerProperties(user?.id);

  if (isLoading) return <div className="py-12 flex justify-center"><Spinner /></div>;

  if (!properties || properties.length === 0) {
    return (
      <p className="text-sm text-neutral-400 text-center py-12">
        Cadastre uma propriedade para configurar a sincronização por calendário.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-info-light text-info-dark rounded-lg text-sm">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Sincronização por calendário (iCal): funciona sem aprovação da Airbnb e troca apenas as
          datas ocupadas (sem preços nem dados do hóspede). A importação roda a cada ~15 minutos.
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {properties.map((p) => (
          <PropertyIcalRow key={p.id} propertyId={p.id} propertyName={p.name} />
        ))}
      </div>
    </div>
  );
}
