import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, ExternalLink, Shield, Key, Mail, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { useConnectChannel, useImportProperties, useImportBookings } from '../../../hooks/useChannels';
import { useSaveBookingComCredentials, useTestBookingComCredentials } from '../../../hooks/useBookingCom';
import type { Channel } from '../../../types';

// ── Schemas per channel ──────────────────────────────────────────────────────
const bookingComSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  providerId: z.string().optional(),
  environment: z.enum(['test', 'production']).default('test'),
});

const genericSchema = z.object({
  email: z.string().email('Email inválido'),
  apiKey: z.string().optional(),
});

type BookingComFormData = z.infer<typeof bookingComSchema>;
type GenericFormData = z.infer<typeof genericSchema>;

interface Props {
  open: boolean;
  channel: Channel | null;
  onClose: () => void;
  businessId: string;
}

type Step = 'credentials' | 'connecting' | 'testing' | 'importing' | 'success';

export function ConnectChannelModal({ open, channel, onClose, businessId }: Props) {
  const [step, setStep] = useState<Step>('credentials');
  const [importedCounts, setImportedCounts] = useState({ properties: 0, bookings: 0 });
  const [showPassword, setShowPassword] = useState(false);

  const connectMutation = useConnectChannel();
  const importPropertiesMutation = useImportProperties();
  const importBookingsMutation = useImportBookings();
  const saveCredentialsMutation = useSaveBookingComCredentials();
  const testCredentialsMutation = useTestBookingComCredentials();

  const isBookingCom = channel?.slug === 'booking_com';

  const bookingComForm = useForm<BookingComFormData>({
    resolver: zodResolver(bookingComSchema),
    defaultValues: { environment: 'test' },
  });

  const genericForm = useForm<GenericFormData>({
    resolver: zodResolver(genericSchema),
  });

  const handleClose = () => {
    bookingComForm.reset();
    genericForm.reset();
    setStep('credentials');
    setImportedCounts({ properties: 0, bookings: 0 });
    setShowPassword(false);
    onClose();
  };

  const onBookingComSubmit = async (data: BookingComFormData) => {
    if (!channel) return;

    try {
      setStep('connecting');
      await saveCredentialsMutation.mutateAsync({
        username: data.username,
        password: data.password,
        providerId: data.providerId || undefined,
        environment: data.environment,
      });

      setStep('testing');
      const testResult = await testCredentialsMutation.mutateAsync();

      if (!testResult.success) {
        setStep('credentials');
        return;
      }

      // Also create the generic connection record
      const connection = await connectMutation.mutateAsync({
        businessId,
        channelSlug: channel.slug,
        accountEmail: data.username,
      });

      setStep('importing');
      const [props, bookings] = await Promise.all([
        importPropertiesMutation.mutateAsync(connection.id),
        importBookingsMutation.mutateAsync(connection.id),
      ]);

      setImportedCounts({ properties: props.length, bookings: bookings.length });
      setStep('success');
    } catch {
      setStep('credentials');
    }
  };

  const onGenericSubmit = async (data: GenericFormData) => {
    if (!channel) return;

    try {
      setStep('connecting');
      await new Promise(res => setTimeout(res, 1500));

      const connection = await connectMutation.mutateAsync({
        businessId,
        channelSlug: channel.slug,
        accountEmail: data.email,
      });

      setStep('importing');
      const [props, bookings] = await Promise.all([
        importPropertiesMutation.mutateAsync(connection.id),
        importBookingsMutation.mutateAsync(connection.id),
      ]);

      setImportedCounts({ properties: props.length, bookings: bookings.length });
      setStep('success');
    } catch {
      setStep('credentials');
    }
  };

  if (!channel) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'success' ? '' : `Conectar ${channel.name}`}
    >
      <div className="p-4 sm:p-6">
        {/* Credentials Step */}
        {step === 'credentials' && isBookingCom && (
          <form onSubmit={bookingComForm.handleSubmit(onBookingComSubmit)} className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                Insira as credenciais da <strong>Booking.com Connectivity API</strong>.
                Disponíveis no Extranet em Connectivity &gt; XML Credentials.
              </p>
            </div>

            <Input
              label="Usuário da API"
              placeholder="Ex: hotel_api_user"
              error={bookingComForm.formState.errors.username?.message}
              {...bookingComForm.register('username')}
            />

            <div className="relative">
              <Input
                label="Senha da API"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={bookingComForm.formState.errors.password?.message}
                {...bookingComForm.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Provider ID (opcional)"
              placeholder="Ex: 12345"
              {...bookingComForm.register('providerId')}
            />

            <Select
              label="Ambiente"
              value={bookingComForm.watch('environment')}
              onChange={(val) => bookingComForm.setValue('environment', val as 'test' | 'production')}
              options={[
                { value: 'test', label: 'Teste (sandbox)' },
                { value: 'production', label: 'Produção' },
              ]}
            />

            {testCredentialsMutation.data && !testCredentialsMutation.data.success && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                Falha na verificação das credenciais. Verifique usuário e senha.
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <a
                href="https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/connectivity.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Booking.com Extranet
              </a>
              <Button type="submit" loading={saveCredentialsMutation.isPending}>
                <Key className="w-4 h-4 mr-1" />
                Conectar
              </Button>
            </div>
          </form>
        )}

        {step === 'credentials' && !isBookingCom && (
          <form onSubmit={genericForm.handleSubmit(onGenericSubmit)} className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Mail className="w-5 h-5 text-neutral-500 shrink-0" />
              <p className="text-sm text-neutral-600">
                Insira o email associado à sua conta no <strong>{channel.name}</strong>.
              </p>
            </div>

            <Input
              label="Email da conta"
              type="email"
              placeholder="seu@email.com"
              error={genericForm.formState.errors.email?.message}
              {...genericForm.register('email')}
            />

            <Input
              label="API Key (opcional)"
              placeholder="Chave de API, se aplicável"
              {...genericForm.register('apiKey')}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit">
                <Key className="w-4 h-4 mr-1" />
                Conectar
              </Button>
            </div>
          </form>
        )}

        {/* Testing credentials (Booking.com only) */}
        {step === 'testing' && (
          <div className="py-8 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 animate-pulse"
              style={{ backgroundColor: channel.color }}
            >
              {channel.name.charAt(0)}
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Testando credenciais...
            </h3>
            <p className="text-neutral-500 mb-6">
              Verificando conexão com a API da {channel.name}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Validando...</span>
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
