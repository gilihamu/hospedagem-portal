import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface GuestCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export function GuestCounter({ value, onChange, min = 1, max = 20, label, className }: GuestCounterProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-lg font-semibold text-neutral-800 w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
