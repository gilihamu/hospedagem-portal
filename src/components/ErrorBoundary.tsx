import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Ignore insertBefore errors caused by browser extensions
    if (error.message?.includes('insertBefore') || error.message?.includes('removeChild')) {
      console.warn('[ErrorBoundary] Ignored DOM manipulation error (likely browser extension):', error.message);
      this.setState({ hasError: false, error: null });
      return;
    }
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback onRetry={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Algo deu errado
      </h1>
      <p className="text-gray-500 mb-6 max-w-md">
        Ocorreu um erro inesperado. Isso pode ser causado por uma extensão do navegador.
        Tente desativar extensões de tradução ou gerenciadores de senha e recarregar a página.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Tentar novamente
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
}
