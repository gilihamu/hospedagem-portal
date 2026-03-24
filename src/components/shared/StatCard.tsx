import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  growth?: number;
  iconColor?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, growth, iconColor = 'text-primary', className }: StatCardProps) {
  const isPositive = (growth ?? 0) >= 0;

  return (
    <div className={cn('card-base p-5', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center', iconColor === 'text-accent' && 'bg-accent/10', iconColor === 'text-success' && 'bg-success-light', iconColor === 'text-info' && 'bg-info-light')}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {growth !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold', isPositive ? 'text-success' : 'text-error')}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-900 mb-1">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}
