import { cn } from '../../utils/cn';
import type { ReactNode, MouseEvent } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  padding?: CardPadding;
  shadow?: boolean;
  hoverable?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
  className?: string;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  padding = 'md',
  shadow = true,
  hoverable = false,
  onClick,
  children,
  className,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-surface-border overflow-hidden',
        shadow && 'shadow-card',
        hoverable && 'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
