import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Home, Building2, ChevronLeft } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/auth.store';
import { authService } from '../../../services/auth.service';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/cn';
import { ROUTES } from '../../../router/routes';
import type { UserRole } from '../../../types';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>('guest');
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role,
      });
      login(result.user, result.token);
      success(`Conta criada com sucesso! Bem-vindo, ${result.user.name?.split(' ')[0] || 'Usuário'}!`);
      if (role === 'host') navigate(ROUTES.DASHBOARD);
      else navigate(ROUTES.HOME);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  };

  if (step === 1) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Criar conta</h1>
        <p className="text-neutral-500 text-sm mb-8">Como você vai usar a plataforma?</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Guest card */}
          <button
            type="button"
            onClick={() => setRole('guest')}
            className={cn(
              'p-5 rounded-xl border-2 text-center transition-all',
              role === 'guest'
                ? 'border-primary bg-primary/5'
                : 'border-surface-border hover:border-neutral-300'
            )}
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', role === 'guest' ? 'bg-primary/10' : 'bg-neutral-100')}>
              <Home className={cn('w-6 h-6', role === 'guest' ? 'text-primary' : 'text-neutral-500')} />
            </div>
            <p className={cn('font-semibold text-sm', role === 'guest' ? 'text-primary' : 'text-neutral-700')}>
              Sou Hóspede
            </p>
            <p className="text-xs text-neutral-400 mt-1">Quero encontrar hospedagens</p>
          </button>

          {/* Host card */}
          <button
            type="button"
            onClick={() => setRole('host')}
            className={cn(
              'p-5 rounded-xl border-2 text-center transition-all',
              role === 'host'
                ? 'border-primary bg-primary/5'
                : 'border-surface-border hover:border-neutral-300'
            )}
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', role === 'host' ? 'bg-primary/10' : 'bg-neutral-100')}>
              <Building2 className={cn('w-6 h-6', role === 'host' ? 'text-primary' : 'text-neutral-500')} />
            </div>
            <p className={cn('font-semibold text-sm', role === 'host' ? 'text-primary' : 'text-neutral-700')}>
              Quero Anunciar
            </p>
            <p className="text-xs text-neutral-400 mt-1">Tenho hospedagem para alugar</p>
          </button>
        </div>

        <Button fullWidth size="lg" onClick={() => setStep(2)}>
          Continuar
        </Button>

        <p className="text-center text-sm text-neutral-500 mt-4">
          Já tem conta?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setStep(1)}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>

      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        {role === 'host' ? 'Cadastro de Anfitrião' : 'Criar conta'}
      </h1>
      <p className="text-neutral-500 text-sm mb-6">Preencha seus dados para continuar</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          placeholder="Seu nome"
          prefixIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

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
          type="password"
          placeholder="Mínimo 6 caracteres"
          prefixIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Repita sua senha"
          prefixIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Criar conta
        </Button>
      </form>

      <p className="text-center text-xs text-neutral-400 mt-4">
        Ao criar uma conta, você concorda com nossos{' '}
        <a href="#" className="text-primary hover:underline">Termos de uso</a>
      </p>
    </div>
  );
}
