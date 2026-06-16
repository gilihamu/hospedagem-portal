import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCurrentMonthOccupancy } from '../../utils/hotelMetrics';
import { useUIStore } from '../../store/ui.store';
import type { Booking } from '../../types';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Props {
  bookings?: Booking[];
  propertyCount: number;
}

export function OccupancyHeatmap({ bookings, propertyCount }: Props) {
  const theme = useUIStore((s) => s.theme);
  const days = getCurrentMonthOccupancy(bookings, propertyCount);
  if (!days.length) return null;

  /** Cor da célula com opacidade proporcional à ocupação (sensível ao tema). */
  const cellColor = (occ: number): string => {
    if (theme === 'dark') {
      return occ <= 0 ? '#334155' : `rgba(109,153,199,${(0.2 + (occ / 100) * 0.8).toFixed(2)})`;
    }
    return occ <= 0 ? '#F1F5F9' : `rgba(30,58,95,${(0.15 + (occ / 100) * 0.8).toFixed(2)})`;
  };

  const monthLabel = format(days[0].date, 'MMMM', { locale: ptBR });
  const lead = days[0].date.getDay();
  const avg = Math.round(days.reduce((s, d) => s + d.occupancy, 0) / days.length);

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-neutral-800 flex items-center gap-2 capitalize">
          <CalendarDays className="w-4 h-4 text-primary" />
          Ocupação de {monthLabel}
        </h2>
        <span className="text-xs text-neutral-500">média <span className="font-semibold text-neutral-700 tabular-nums">{avg}%</span></span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-neutral-400">{w}</div>
        ))}
        {Array.from({ length: lead }).map((_, i) => <div key={`lead-${i}`} />)}
        {days.map((d) => (
          <div
            key={d.date.toISOString()}
            title={`${format(d.date, 'dd/MM')} · ${d.occupancy}% de ocupação`}
            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium tabular-nums"
            style={{ backgroundColor: cellColor(d.occupancy), color: d.occupancy > 55 ? '#fff' : theme === 'dark' ? '#94A3B8' : '#64748B' }}
          >
            {d.date.getDate()}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-neutral-400">
        <span>menos</span>
        {[0, 25, 50, 75, 100].map((o) => (
          <span key={o} className="w-3.5 h-3.5 rounded" style={{ backgroundColor: cellColor(o) }} />
        ))}
        <span>mais</span>
      </div>
    </div>
  );
}
