import { cn } from '../../utils/cn';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({ width, height, rounded = false, className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-neutral-200 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer',
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{ width, height }}
    />
  );
}
