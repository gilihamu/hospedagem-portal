import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, ExternalLink, Shield, Key, Mail } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useConnectChannel, useImportProperties, useImportBookings } from '../../../hooks/useChannels';
import type { Channel } from '../../../types';

const schema = z.object({
  email: z.string().email('Email inválido'),
  apiKey: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  channel: Channel | null;
  onClose: () => void;
  businessId: string;
}

type Step = 'credentials' | 'connecting' | 'oauth' | 'importing' | 'success';

export function ConnectChannelModal({ open, channel, onClose, businessId }: Props) {
  const [step, setStep] = useState<Step>('credentials');
  const [importedCounts, setImportedCounts] = useState({ properties: 0, bookings: 0 });

  const connectMutation = useConnectChannel();
  const importPropertiesMutation = useImportProperties();
  const importBookingsMutation = useImportBookings();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleClose = () => {
    reset();
    setStep('credentials');
    setImportedCounts({ properties: 0, bookings: 0 });
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!channel) return;

    try {
      // Simulate OAuth flow
      setStep('oauth');
      await new Promise(res => setTimeout(res, 1500));

      setStep('connecting');
      const connection = await connectMutation.mutateAsync({
        businessId,
        channelSlug: channel.slug,
        accountEmail: data.email,
      });

      // Auto-import after connection
      setStep('importing');
      
      const properties = await importPropertiesMutation.mutateAsync(connection.id);
      const bookings = await importBookingsMutation.mutateAsync(connection.id);
      
      setImportedCounts({
        properties: properties.length,
        bookings: bookings.length,
      });

      setStep('success');
    } catch (error) {
      console.error('Connection error:', error);
      setStep('credentials');
    }
  };

  if (!channel) return null;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={step === 'success' ? '' : `Conectar ${channel.name}`}
    >
      <div className="space-y-6">
        {/* Credentials Step */}
        {step === 'credentials' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: `${channel.color}10` }}>
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: channel.color }}
              >
                {channel.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">{channel.name}</h3>
                <p className="text-sm text-neutral-500">{channel.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Email da Conta"
                placeholder={`Seu email cadastrado no ${channel.name}`}
                prefixIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Chave de API (opcional)"
                placeholder="Informe se tiver uma chave de API"
                prefixIcon={<Key className="w-4 h-4" />}
                error={errors.apiKey?.message}
                {...register('apiKey')}
              />
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-600">
                  <p className="font-medium text-neutral-800 mb-1">Conexão Segura</p>
                  <p>Você será redirecionado para autorizar o acesso no {channel.name}. Não armazenamos suas credenciais de login.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">
                <ExternalLink className="w-4 h-4 mr-2" />
                Conectar com {channel.name}
              </Button>
            </div>
          </form>
        )}

        {/* OAuth Simulation Step */}
        {step === 'oauth' && (
          <div className="py-8 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 animate-pulse"
              style={{ backgroundColor: channel.color }}
            >
              {channel.name.charAt(0)}
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Autorizando acesso...
            </h3>
            <p className="text-neutral-500 mb-6">
              Conectando com sua conta {channel.name}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Aguardando autorização...</span>
            </div>
          </div>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Estabelecendo conexão...
            </h3>
            <p className="text-neutral-500">
              Configurando sincronização com {channel.name}
            </p>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="py-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Importando dados...
            </h3>
            <p className="text-neutral-500 mb-4">
              Buscando suas acomodações e reservas do {channel.name}
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Acomodações</span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reservas</span>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">
              Conexão realizada com sucesso!
            </h3>
            <p className="text-neutral-500 mb-6">
              {channel.name} foi conectado e seus dados foram importados.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <div className="p-4 bg-primary/5 rounded-xl">
                <p className="text-3xl font-bold text-primary">{importedCounts.properties}</p>
                <p className="text-sm text-neutral-500">Acomodações</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-xl">
                <p className="text-3xl font-bold text-accent">{importedCounts.bookings}</p>
                <p className="text-sm text-neutral-500">Reservas</p>
              </div>
            </div>

            <Button onClick={handleClose} className="min-w-[200px]">
              Concluir
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
