import { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import {
  useBookingComCredentials,
  useSaveBookingComCredentials,
  useTestBookingComCredentials,
} from '../../../hooks/useBookingCom';

export function CredentialsPanel() {
  const { data: creds, isLoading } = useBookingComCredentials();
  const saveMutation = useSaveBookingComCredentials();
  const testMutation = useTestBookingComCredentials();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [providerId, setProviderId] = useState('');
  const [environment, setEnvironment] = useState<'test' | 'production'>('test');
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      username,
      password,
      providerId: providerId || undefined,
      environment,
    });
    setPassword('');
  };

  const handleTest = async () => {
    await testMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="card-base p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="card-base p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Credenciais da Booking.com
        </h3>
        {creds?.isConfigured && (
          <Badge variant={creds.isVerified ? 'success' : 'warning'}>
            {creds.isVerified ? 'Verificado' : 'Não verificado'}
          </Badge>
        )}
      </div>

      {creds?.isConfigured && (
        <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Usuário</span>
            <span className="font-medium text-neutral-800">{creds.username}</span>
          </div>
          {creds.providerId && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Provider ID</span>
              <span className="font-medium text-neutral-800">{creds.providerId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Ambiente</span>
            <Badge variant={creds.environment === 'production' ? 'success' : 'warning'}>
              {creds.environment === 'production' ? 'Produção' : 'Teste'}
            </Badge>
          </div>
          {creds.verifiedAt && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Verificado em</span>
              <span className="text-neutral-700">
                {new Date(creds.verifiedAt).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
          {creds.lastError && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 rounded text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{creds.lastError}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          {creds?.isConfigured
            ? 'Atualize suas credenciais da Booking.com Connectivity API.'
            : 'Configure suas credenciais da Booking.com Connectivity API para começar a sincronizar.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Usuário da API"
            placeholder="booking_api_user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="relative">
            <Input
              label="Senha da API"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Provider ID (opcional)"
            placeholder="Ex: 12345"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          />
          <Select
            label="Ambiente"
            value={environment}
            onChange={(val) => setEnvironment(val as unknown as 'test' | 'production')}
            options={[
              { value: 'test', label: 'Teste (sandbox)' },
              { value: 'production', label: 'Produção' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={!username || !password}
            loading={saveMutation.isPending}
          >
            {creds?.isConfigured ? 'Atualizar Credenciais' : 'Salvar Credenciais'}
          </Button>

          {creds?.isConfigured && (
            <Button
              variant="outline"
              onClick={handleTest}
              loading={testMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Testar Conexão
            </Button>
          )}
        </div>

        {testMutation.data && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              testMutation.data.success
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {testMutation.data.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {testMutation.data.message || (testMutation.data.success ? 'Conexão bem-sucedida!' : 'Falha na conexão.')}
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <a
            href="https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/connectivity.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Acessar Booking.com Extranet (Connectivity)
          </a>
        </div>
      </div>
    </div>
  );
}
