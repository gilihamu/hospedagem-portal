import { PlaneLanding, PlaneTakeoff, BedDouble, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Skeleton } from '../ui/Skeleton';
import type { TodayOps } from '../../utils/hotelMetrics';

interface TodayStripProps {
  ops?: TodayOps;
  loading?: boolean;
}

function tiles(ops: TodayOps) {
  return [
    { icon: PlaneLanding, label: 'Check-ins hoje', value: ops.checkInsToday, color: 'text-success', bg: 'bg-success-light' },
    { icon: PlaneTakeoff, label: 'Check-outs hoje', value: ops.checkOutsToday, color: 'text-info', bg: 'bg-info-light' },
    { icon: BedDouble, label: 'Hospedados', value: ops.inHouse, color: 'text-primary', bg: 'bg-primary/10' },
    {
      icon: Clock,
      label: 'Pendências',
      value: ops.pending,
      color: ops.pending > 0 ? 'text-warning' : 'text-neutral-400',
      bg: ops.pending > 0 ? 'bg-warning-light' : 'bg-neutral-100',
    },
  ];
}

export function TodayStrip({ ops, loading }: TodayStripProps) {
  if (loading || !ops) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-base px-4 py-3 flex items-center gap-3">
            <Skeleton width="36px" height="36px" className="rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton width="40%" height="18px" />
              <Skeleton width="70%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles(ops).map((t) => (
        <div
          key={t.label}
          className="card-base px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:shadow-card-md"
        >
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', t.bg)}>
            <t.icon className={cn('w-4 h-4', t.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-neutral-900 tabular-nums leading-none">{t.value}</p>
            <p className="text-xs text-neutral-500 mt-1 truncate">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
