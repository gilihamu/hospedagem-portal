import { Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useChannels } from '../../../hooks/useChannels';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { cn } from '../../../utils/cn';
import type { ChannelSlug } from '../../../types';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function StepChannels({ onNext, onBack }: Props) {
  const { data: channels } = useChannels();
  const { selectedChannels, setSelectedChannels } = useOnboardingStore();

  const toggle = (slug: ChannelSlug) => {
    if (selectedChannels.includes(slug)) {
      setSelectedChannels(selectedChannels.filter((s) => s !== slug));
    } else {
      setSelectedChannels([...selectedChannels, slug]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-base p-6">
        <h3 className="font-semibold text-neutral-800 mb-1">Conecte seus Canais de Venda</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Selecione as plataformas onde você anuncia para importar automaticamente suas acomodações e reservas.
          Você pode pular esta etapa e configurar depois.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels?.map((ch) => {
            const selected = selectedChannels.includes(ch.slug);
            return (
              <button
                key={ch.slug}
                type="button"
                onClick={() => toggle(ch.slug)}
                className={cn(
                  'relative p-5 rounded-xl border-2 text-left transition-all hover:shadow-md',
                  selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white',
                )}
              >
                {/* Selection check */}
                {selected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Brand color bar */}
                <div
                  className="w-10 h-1.5 rounded-full mb-3"
                  style={{ backgroundColor: ch.color }}
                />

                <h4 className="font-semibold text-neutral-800 text-base mb-1">{ch.name}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{ch.description}</p>
              </button>
            );
          })}
        </div>

        {selectedChannels.length > 0 && (
          <div className="mt-5 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">
              {selectedChannels.length} {selectedChannels.length === 1 ? 'canal selecionado' : 'canais selecionados'} — você poderá conectar suas contas no Gerenciador de Canais após concluir o cadastro.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Voltar</Button>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onNext}>
            Pular esta etapa
          </Button>
          <Button type="button" onClick={onNext}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
