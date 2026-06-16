import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Sparkline } from './Sparkline';
import { useCountUp } from '../../hooks/useCountUp';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  /** Valor já formatado (usado quando `countTo` não é informado). */
  value?: string | number;
  /** Quando informado, o número é animado de 0 até este valor no mount. */
  countTo?: number;
  /** Formata o valor animado de `countTo` (ex.: formatCurrency). */
  format?: (n: number) => string;
  growth?: number;
  iconColor?: string;
  /** Série para o mini-gráfico de tendência. */
  series?: number[];
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  countTo,
  format,
  growth,
  iconColor = 'text-primary',
  series,
  className,
}: StatCardProps) {
  const isPositive = (growth ?? 0) >= 0;
  const animated = useCountUp(countTo ?? 0);
  const display =
    countTo !== undefined
      ? format
        ? format(animated)
        : Math.round(animated).toLocaleString('pt-BR')
      : value;

  return (
    <div
      className={cn(
        'card-base p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center',
            iconColor === 'text-accent' && 'bg-accent/10',
            iconColor === 'text-success' && 'bg-success-light',
            iconColor === 'text-info' && 'bg-info-light',
            iconColor === 'text-warning' && 'bg-warning-light'
          )}
        >
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {growth !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold tabular-nums',
              isPositive ? 'text-success' : 'text-error'
            )}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-neutral-900 mb-1 tabular-nums tracking-tight truncate">
            {display}
          </p>
          <p className="text-sm text-neutral-500">{label}</p>
        </div>
        {series && series.length > 1 && (
          <div className={cn('shrink-0 self-center', iconColor)}>
            <Sparkline data={series} />
          </div>
        )}
      </div>
    </div>
  );
}
