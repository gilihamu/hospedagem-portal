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
        'bg-neutral-200 animate-pulse',
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{ width, height }}
    />
  );
}
