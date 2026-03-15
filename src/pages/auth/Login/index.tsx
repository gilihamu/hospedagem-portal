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

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Bem-vindo de volta</h1>
      <p className="text-neutral-500 text-sm mb-6">Entre na sua conta para continuar</p>

      {/* Demo credentials */}
      <div className="bg-primary/5 rounded-xl p-4 mb-6 text-xs">
        <p className="font-semibold text-primary mb-2">Credenciais de demonstração:</p>
        <div className="space-y-1 text-neutral-600">
          <p><strong>Admin:</strong> admin@hospedagem.com</p>
          <p><strong>Anfitrião:</strong> carlos@hotel.com</p>
          <p><strong>Hóspede:</strong> joao@email.com</p>
          <p className="text-neutral-400 mt-2">Senha: qualquer valor (ex: 123456)</p>
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
