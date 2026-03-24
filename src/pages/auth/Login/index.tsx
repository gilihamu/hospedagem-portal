import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/auth.store';
import { authService } from '../../../services/auth.service';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../router/routes';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof schema>;

interface DemoAccount {
  email: string;
  name: string;
  role: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'joao@praiadosol.com.br', name: 'João Silva', role: 'Host', description: '🏠 Anfitrião' },
  { email: 'maria@gmail.com', name: 'Maria Santos', role: 'Guest', description: '🧳 Hóspede' },
  { email: 'admin@hospedabr.com', name: 'Super Admin', role: 'SuperAdmin', description: '🔧 Admin' },
  { email: 'fernanda@praiadosol.com.br', name: 'Fernanda Souza', role: 'PropertyManager', description: '👩‍💼 Gerente' },
];

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authService.login(data.email, data.password);
      login(result.user, result.token);
      success(`Bem-vindo de volta, ${result.user.name?.split(' ')[0] || 'Usuário'}!`);
      if (result.user.role === 'admin') navigate(ROUTES.ADMIN);
      else if (result.user.role === 'host') navigate(ROUTES.DASHBOARD);
      else navigate(ROUTES.HOME);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoLoading(account.email);
    try {
      const result = await authService.demoLogin(account.email);
      login(result.user, result.token);
      success(`Bem-vindo, ${result.user.name?.split(' ')[0]}! (conta demo)`);
      if (result.user.role === 'admin') navigate(ROUTES.ADMIN);
      else if (result.user.role === 'host') navigate(ROUTES.DASHBOARD);
      else navigate(ROUTES.HOME);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro no login demo');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Bem-vindo de volta</h1>
      <p className="text-neutral-500 text-sm mb-6">Entre na sua conta para continuar</p>

      {/* Demo Quick Login */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-700 mb-3">⚡ Login rápido — contas de demonstração:</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              onClick={() => handleDemoLogin(account)}
              disabled={!!demoLoading}
              className="flex items-center gap-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-left transition disabled:opacity-50 disabled:cursor-wait"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-800 truncate">{account.description}</p>
                <p className="text-[10px] text-neutral-400 truncate">{account.name}</p>
              </div>
              {demoLoading === account.email && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-neutral-400">ou entre com sua conta</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          prefixIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          prefixIcon={<Lock className="w-4 h-4" />}
          suffixIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-6">
        Não tem conta?{' '}
        <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
