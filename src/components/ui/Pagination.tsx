import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, total, pageSize, className }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  const from = total && pageSize ? (page - 1) * pageSize + 1 : undefined;
  const to = total && pageSize ? Math.min(page * pageSize, total) : undefined;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {total && from && to ? (
        <p className="text-sm text-neutral-500">
          Mostrando <span className="font-medium text-neutral-700">{from}–{to}</span> de{' '}
          <span className="font-medium text-neutral-700">{total}</span>
        </p>
      ) : <span />}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
              p === page
                ? 'bg-primary text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            )}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
