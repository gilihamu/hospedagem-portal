import { type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function Checkbox({ label, error, className, id, ...props }: CheckboxProps) {
  const inputId = id || `checkbox-${Math.random()}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          id={inputId}
          className={cn(
            'w-4 h-4 rounded border-surface-border text-primary focus:ring-primary/20 cursor-pointer',
            className
          )}
          {...props}
        />
        {label && <span className="text-sm text-neutral-700">{label}</span>}
      </label>
      {error && <p className="text-xs text-error ml-6">{error}</p>}
    </div>
  );
}
