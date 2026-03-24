import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefixIcon, suffixIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 text-neutral-400 pointer-events-none">{prefixIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-base',
              prefixIcon && 'pl-9',
              suffixIcon && 'pr-9',
              error && 'border-error focus:ring-error/20 focus:border-error',
              className
            )}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-3 text-neutral-400">{suffixIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
