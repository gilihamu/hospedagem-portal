import type { BookingStatus } from '../../types';
import { Badge } from '../ui/Badge';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const config: Record<BookingStatus, { label: string; variant: 'warning' | 'success' | 'error' | 'info' | 'default' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'error' },
  completed: { label: 'Concluída', variant: 'info' },
  no_show: { label: 'No-show', variant: 'default' },
};

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
