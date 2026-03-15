import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Plus, Check, Loader2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { useChannels, useConnectChannel, useImportProperties } from '../../../hooks/useChannels';
import { useAuthStore } from '../../../store/auth.store';
import { cn } from '../../../utils/cn';
import type { ChannelSlug } from '../../../types';

const propSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  type: z.enum(['hotel', 'pousada', 'hostel', 'apartamento', 'resort', 'chalé']),
  pricePerNight: z.coerce.number().min(1, 'Preço obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().min(2, 'Estado obrigatório'),
});

type PropForm = z.output<typeof propSchema>;

interface Props {
  onNext: () => void;
  onBack: () => void;
}

type ImportState = Record<string, 'idle' | 'connecting' | 'importing' | 'done'>;

export function StepAccommodation({ onNext, onBack }: Props) {
  const { user } = useAuthStore();
  const { selectedChannels, businessData, addImportedPropertyIds, setManualPropertyId } = useOnboardingStore();
  const { data: channels } = useChannels();
  const connectMutation = useConnectChannel();
  const importMutation = useImportProperties();
  const [mode, setMode] = useState<'choose' | 'import' | 'manual'>('choose');
  const [importStates, setImportStates] = useState<ImportState>({});
  const [manualDone, setManualDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<PropForm>({ resolver: zodResolver(propSchema) as any });

  const handleImport = async (slug: ChannelSlug) => {
    if (!businessData.name) return;

    setImportStates((s) => ({ ...s, [slug]: 'connecting' }));

    try {
      // First connect
      const conn = await connectMutation.mutateAsync({
        businessId: 'biz1', // demo
        channelSlug: slug,
        accountEmail: businessData.email || user?.email || 'demo@email.com',
      });

      setImportStates((s) => ({ ...s, [slug]: 'importing' }));

      // Then import
      const imported = await importMutation.mutateAsync(conn.id);
      addImportedPropertyIds(imported.map((p) => p.id));

      setImportStates((s) => ({ ...s, [slug]: 'done' }));
    } catch {
      setImportStates((s) => ({ ...s, [slug]: 'idle' }));
    }
  };

  const onManualSubmit = async (data: PropForm) => {
    // We'll use the property service directly for a simplified create
    const { propertyService } = await import('../../../services/property.service');
    const prop = await propertyService.create({
      ownerId: user?.id || 'u2',
      ownerName: user?.name || 'Host',
      name: data.name,
      type: data.type,
      description: '',
      images: [],
      address: { street: '', number: '', neighborhood: '', city: data.city, state: data.state, zipCode: '' },
      amenities: ['wifi'],
      pricePerNight: data.pricePerNight,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      status: 'active',
    });
    setManualPropertyId(prop.id);
    setManualDone(true);
  };

  const selectedChannelObjects = channels?.filter((c) => selectedChannels.includes(c.slug)) || [];
  const anyDone = Object.values(importStates).some((s) => s === 'done') || manualDone;

  return (
    <div className="space-y-6">
      {mode === 'choose' && (
        <div className="card-base p-6">
          <h3 className="font-semibold text-neutral-800 mb-1">Adicione sua primeira Acomodação</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Escolha como deseja adicionar suas acomodações ao sistema.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedChannels.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('import')}
                className="p-6 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:shadow-md transition-all text-left"
              >
                <Download className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-semibold text-neutral-800 mb-1">Importar dos Canais</h4>
                <p className="text-sm text-neutral-500">
                  Importe automaticamente suas acomodações de {selectedChannels.length} {selectedChannels.length === 1 ? 'canal selecionado' : 'canais selecionados'}
                </p>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMode('manual')}
              className="p-6 rounded-xl border-2 border-neutral-200 hover:border-accent hover:shadow-md transition-all text-left"
            >
              <Plus className="w-8 h-8 text-accent mb-3" />
              <h4 className="font-semibold text-neutral-800 mb-1">Criar Manualmente</h4>
              <p className="text-sm text-neutral-500">
                Cadastre suas acomodações preenchendo os dados básicos
              </p>
            </button>
          </div>
        </div>
      )}

      {mode === 'import' && (
        <div className="card-base p-6">
          <h3 className="font-semibold text-neutral-800 mb-1">Importar Acomodações</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Clique em cada canal para conectar e importar suas acomodações automaticamente.
          </p>

          <div className="space-y-3">
            {selectedChannelObjects.map((ch) => {
              const state = importStates[ch.slug] || 'idle';
              return (
                <div
                  key={ch.slug}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                    state === 'done' ? 'border-success/30 bg-success/5' : 'border-neutral-200',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                    <span className="font-medium text-neutral-800">{ch.name}</span>
                  </div>

                  {state === 'idle' && (
                    <Button size="sm" onClick={() => handleImport(ch.slug)}>
                      Conectar & Importar
                    </Button>
                  )}
                  {state === 'connecting' && (
                    <span className="flex items-center gap-2 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" /> Conectando...
                    </span>
                  )}
                  {state === 'importing' && (
                    <span className="flex items-center gap-2 text-sm text-amber-600">
                      <Loader2 className="w-4 h-4 animate-spin" /> Importando...
                    </span>
                  )}
                  {state === 'done' && (
                    <span className="flex items-center gap-2 text-sm text-success font-medium">
                      <Check className="w-4 h-4" /> Importado com sucesso!
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleSubmit(onManualSubmit)} className="card-base p-6">
          <h3 className="font-semibold text-neutral-800 mb-1">Cadastro Rápido de Acomodação</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Preencha os dados básicos. Você poderá completar o cadastro depois.
          </p>

          {manualDone ? (
            <div className="p-6 bg-success/10 border border-success/20 rounded-xl text-center">
              <Check className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="font-semibold text-success">Acomodação criada com sucesso!</p>
              <p className="text-sm text-neutral-500 mt-1">Você pode editar os detalhes completos depois.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome *" placeholder="Ex: Suite Premium" error={errors.name?.message} {...register('name')} />
                <Select
                  label="Tipo *"
                  error={errors.type?.message}
                  options={[
                    { value: 'hotel', label: 'Hotel' },
                    { value: 'pousada', label: 'Pousada' },
                    { value: 'hostel', label: 'Hostel' },
                    { value: 'apartamento', label: 'Apartamento' },
                    { value: 'resort', label: 'Resort' },
                    { value: 'chalé', label: 'Chalé' },
                  ]}
                  {...register('type')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Input label="Preço/Noite (R$) *" type="number" placeholder="250" error={errors.pricePerNight?.message} {...register('pricePerNight')} />
                <Input label="Cidade *" placeholder="Rio de Janeiro" error={errors.city?.message} {...register('city')} />
                <Input label="Estado *" placeholder="RJ" error={errors.state?.message} {...register('state')} />
              </div>
              <div className="mt-5">
                <Button type="submit">Criar Acomodação</Button>
              </div>
            </>
          )}
        </form>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={mode === 'choose' ? onBack : () => setMode('choose')}>
          Voltar
        </Button>
        <div className="flex gap-3">
          {!anyDone && (
            <Button type="button" variant="ghost" onClick={onNext}>
              Pular esta etapa
            </Button>
          )}
          {anyDone && (
            <Button type="button" onClick={onNext}>
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
