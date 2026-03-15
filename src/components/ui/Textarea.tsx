import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCounter?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, showCounter, className, id, maxLength, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          value={value}
          className={cn(
            'input-base resize-none',
            error && 'border-error focus:ring-error/20 focus:border-error',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center">
          {error ? (
            <p className="text-xs text-error">{error}</p>
          ) : helperText ? (
            <p className="text-xs text-neutral-500">{helperText}</p>
          ) : (
            <span />
          )}
          {showCounter && maxLength && (
            <p className="text-xs text-neutral-400">
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
