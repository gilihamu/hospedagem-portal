import { cn } from '../../utils/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'primary' | 'white' | 'accent';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'border-primary/20 border-t-primary',
  white: 'border-white/30 border-t-white',
  accent: 'border-accent/20 border-t-accent',
};

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}
