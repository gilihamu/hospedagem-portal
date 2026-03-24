import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StarRating({
  rating,
  maxStars = 5,
  showText = false,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;

        const Tag = interactive ? 'button' : 'span';
        return (
          <Tag
            key={i}
            {...(interactive ? { type: 'button' as const, onClick: onChange ? () => onChange(i + 1) : undefined } : {})}
            className={cn(
              'text-accent',
              interactive && 'cursor-pointer hover:scale-110 transition-transform'
            )}
          >
            <Star
              className={cn(sizeClasses[size], filled || partial ? 'fill-accent' : 'fill-neutral-200')}
            />
          </Tag>
        );
      })}
      {showText && (
        <span className="ml-1 text-sm font-medium text-neutral-700">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
