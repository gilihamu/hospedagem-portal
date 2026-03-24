import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/auth.service';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../router/routes';

const schema = z.object({
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { error: showError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      showError('Token de recuperação inválido');
      return;
    }
    try {
      await authService.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.LOGIN), 3000);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Senha redefinida!</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Sua senha foi alterada com sucesso. Redirecionando para o login...
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" fullWidth>
            Ir para login
          </Button>
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Link inválido</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Este link de recuperação de senha é inválido ou já expirou. Solicite um novo link.
        </p>
        <Link to={ROUTES.FORGOT_PASSWORD}>
          <Button fullWidth>Solicitar novo link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Redefinir senha</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Digite sua nova senha abaixo.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nova senha"
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

        <Input
          label="Confirmar nova senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          prefixIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Redefinir senha
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-6">
        <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
