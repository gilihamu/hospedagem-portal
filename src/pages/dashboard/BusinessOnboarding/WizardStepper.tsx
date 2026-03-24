import { Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

const STEPS = [
  { num: 1, label: 'Empresa' },
  { num: 2, label: 'Endereço' },
  { num: 3, label: 'Canais' },
  { num: 4, label: 'Acomodação' },
  { num: 5, label: 'Revisão' },
];

interface Props {
  current: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ current, onStepClick }: Props) {
  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, i) => {
        const done = current > step.num;
        const active = current === step.num;
        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onStepClick?.(step.num)}
              disabled={step.num > current}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2',
                  done && 'bg-success border-success text-white',
                  active && 'bg-primary border-primary text-white shadow-lg shadow-primary/30',
                  !done && !active && 'bg-white border-neutral-300 text-neutral-400',
                )}
              >
                {done ? <Check className="w-5 h-5" /> : step.num}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  active ? 'text-primary' : done ? 'text-success' : 'text-neutral-400',
                )}
              >
                {step.label}
              </span>
            </button>

            {/* connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={cn(
                    'h-0.5 rounded-full transition-colors',
                    current > step.num ? 'bg-success' : 'bg-neutral-200',
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
