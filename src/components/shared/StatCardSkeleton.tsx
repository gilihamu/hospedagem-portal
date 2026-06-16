import { Skeleton } from '../ui/Skeleton';

export function StatCardSkeleton() {
  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton width="44px" height="44px" className="rounded-xl" />
        <Skeleton width="40px" height="16px" />
      </div>
      <Skeleton width="60%" height="26px" className="mb-2" />
      <Skeleton width="45%" height="14px" />
    </div>
  );
}
