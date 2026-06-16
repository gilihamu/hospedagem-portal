import { TrendingUp, TrendingDown, Award, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Insight } from '../../utils/hotelMetrics';

const toneClass: Record<Insight['tone'], string> = {
  success: 'bg-success-light text-success-dark',
  info: 'bg-info-light text-info-dark',
  warning: 'bg-warning-light text-warning-dark',
  neutral: 'bg-neutral-100 text-neutral-600',
};

const toneIcon: Record<Insight['tone'], LucideIcon> = {
  success: TrendingUp,
  info: Award,
  warning: TrendingDown,
  neutral: Radio,
};

export function InsightCallouts({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((it, i) => {
        const Icon = toneIcon[it.tone];
        return (
          <span
            key={i}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium', toneClass[it.tone])}
          >
            <Icon className="w-3.5 h-3.5" />
            {it.text}
          </span>
        );
      })}
    </div>
  );
}
