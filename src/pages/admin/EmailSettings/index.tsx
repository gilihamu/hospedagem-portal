import { useState, useEffect } from 'react';
import { Mail, Save, SendHorizonal, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../../services/admin.service';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';

interface EmailSettingsForm {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useSsl: boolean;
  useStartTls: boolean;
  isEnabled: boolean;
}

const defaultForm: EmailSettingsForm = {
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: '',
  useSsl: true,
  useStartTls: false,
  isEnabled: true,
};

export function AdminEmailSettingsPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [form, setForm] = useState<EmailSettingsForm>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-email-settings'],
    queryFn: () => adminService.getEmailSettings(),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: '',
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        useSsl: settings.useSsl,
        useStartTls: settings.useStartTls,
        isEnabled: settings.isEnabled,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: EmailSettingsForm) => adminService.saveEmailSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-settings'] });
      success('Configurações salvas com sucesso!');
    },
    onError: () => showError('Erro ao salvar configurações.'),
  });

  const testMutation = useMutation({
    mutationFn: (email: string) => adminService.sendTestEmail(email),
    onSuccess: () => {
      setTestStatus('success');
      success('E-mail de teste enviado com sucesso!');
    },
    onError: () => {
      setTestStatus('error');
      showError('Falha ao enviar e-mail de teste. Verifique as configurações SMTP.');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleTest = () => {
    if (!testEmail) {
      showError('Informe um e-mail para teste.');
      return;
    }
    setTestStatus('idle');
    testMutation.mutate(testEmail);
  };

  const updateField = <K extends keyof EmailSettingsForm>(key: K, value: EmailSettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Configurações de E-mail</h1>
        <p className="text-sm text-neutral-500">
          Configuração global de SMTP para envio de e-mails a hóspedes e usuários.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-800">Status do serviço</h2>
              <p className="text-xs text-neutral-500">Ativar ou desativar o envio global de e-mails.</p>
            </div>
            <Switch
              checked={form.isEnabled}
              onChange={(v) => updateField('isEnabled', v)}
              label={form.isEnabled ? 'Ativo' : 'Inativo'}
            />
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Servidor SMTP
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Host SMTP"
              placeholder="smtp.gmail.com"
              value={form.smtpHost}
              onChange={(e) => updateField('smtpHost', e.target.value)}
              required
            />
            <Input
              label="Porta"
              type="number"
              placeholder="587"
              value={String(form.smtpPort)}
              onChange={(e) => updateField('smtpPort', Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Usuário SMTP"
              placeholder="user@exemplo.com"
              value={form.smtpUsername}
              onChange={(e) => updateField('smtpUsername', e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="Senha SMTP"
                type={showPassword ? 'text' : 'password'}
                placeholder={settings ? '••••••••' : 'Sua senha SMTP'}
                value={form.smtpPassword}
                onChange={(e) => updateField('smtpPassword', e.target.value)}
                required={!settings}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            <Switch
              checked={form.useSsl}
              onChange={(v) => updateField('useSsl', v)}
              label="SSL"
            />
            <Switch
              checked={form.useStartTls}
              onChange={(v) => updateField('useStartTls', v)}
              label="STARTTLS"
            />
          </div>
        </div>

        {/* From Settings */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-800">Remetente</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail remetente"
              type="email"
              placeholder="noreply@hospedabr.com.br"
              value={form.fromEmail}
              onChange={(e) => updateField('fromEmail', e.target.value)}
              required
            />
            <Input
              label="Nome remetente"
              placeholder="HospedaBR"
              value={form.fromName}
              onChange={(e) => updateField('fromName', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Save */}
        <Button type="submit" className="w-full sm:w-auto" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar configurações
        </Button>
      </form>

      {/* Test Email */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <SendHorizonal className="w-4 h-4 text-primary" />
          Enviar e-mail de teste
        </h2>
        <p className="text-xs text-neutral-500">
          Valide a configuração SMTP enviando um e-mail de teste.
        </p>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="E-mail destinatário"
              type="email"
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => { setTestEmail(e.target.value); setTestStatus('idle'); }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testMutation.isPending || !settings}
          >
            {testMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <SendHorizonal className="w-4 h-4 mr-2" />
            )}
            Testar
          </Button>
        </div>

        {testStatus === 'success' && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            E-mail enviado com sucesso!
          </p>
        )}
        {testStatus === 'error' && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Falha ao enviar. Verifique as configurações SMTP.
          </p>
        )}

        {!settings && (
          <p className="text-xs text-amber-600">
            Salve as configurações antes de enviar um teste.
          </p>
        )}
      </div>
    </div>
  );
}
