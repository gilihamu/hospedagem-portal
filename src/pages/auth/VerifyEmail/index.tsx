import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/auth.service';
import { ROUTES } from '../../../router/routes';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de verificação inválido ou ausente.');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate(ROUTES.LOGIN), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao verificar email.');
      });
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verificando seu email...</h1>
        <p className="text-neutral-500 text-sm">
          Aguarde enquanto confirmamos seu endereço de email.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Email verificado com sucesso!</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Seu email foi confirmado. Redirecionando para o login...
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" fullWidth>
            Ir para login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-8 h-8 text-error" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Falha na verificação</h1>
      <p className="text-neutral-500 text-sm mb-6">
        {errorMessage}
      </p>
      <Link to={ROUTES.LOGIN}>
        <Button fullWidth>Voltar ao login</Button>
      </Link>
    </div>
  );
}
