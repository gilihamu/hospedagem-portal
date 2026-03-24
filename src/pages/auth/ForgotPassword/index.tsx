import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/auth.service';
import { useToast } from '../../../hooks/useToast';
import { ROUTES } from '../../../router/routes';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { error: showError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erro ao enviar email de recuperação');
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">E-mail enviado!</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" fullWidth>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Esqueceu a senha?</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Digite seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          prefixIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Enviar link de recuperação
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
