import { Skeleton } from '../ui/Skeleton';

export function PropertyCardSkeleton() {
  return (
    <div className="card-base overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton height="16px" width="70%" />
        <Skeleton height="12px" width="50%" />
        <div className="flex items-center justify-between">
          <Skeleton height="14px" width="60px" />
          <Skeleton height="16px" width="80px" />
        </div>
      </div>
    </div>
  );
}
