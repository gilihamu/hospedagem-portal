import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ToastItem } from '../../types';

interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const config = {
  success: { icon: CheckCircle, classes: 'border-success bg-success-light text-success-dark', iconClass: 'text-success' },
  error: { icon: AlertCircle, classes: 'border-error bg-error-light text-error-dark', iconClass: 'text-error' },
  warning: { icon: AlertTriangle, classes: 'border-warning bg-warning-light text-warning-dark', iconClass: 'text-warning' },
  info: { icon: Info, classes: 'border-info bg-info-light text-info-dark', iconClass: 'text-info' },
};

export function Toast({ toast, onClose }: ToastProps) {
  const { icon: Icon, classes, iconClass } = config[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-card-md animate-slide-up max-w-sm w-full',
        classes
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconClass)} />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
