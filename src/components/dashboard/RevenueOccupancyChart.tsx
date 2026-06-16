import { useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useRevenueData } from '../../hooks/useAnalytics';
import { getMonthlyOccupancy } from '../../utils/hotelMetrics';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { Skeleton } from '../ui/Skeleton';
import type { Booking } from '../../types';

const PERIODS = [
  { v: 3, l: '3m' },
  { v: 6, l: '6m' },
  { v: 12, l: '12m' },
];

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey?: string | number; value?: number }>;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const occ = payload.find((p) => p.dataKey === 'occupancy')?.value ?? 0;
  return (
    <div className="rounded-lg border border-surface-border bg-white px-3 py-2 shadow-card-md text-xs">
      <p className="font-semibold text-neutral-800 mb-1">{label}</p>
      <p className="text-neutral-600">Receita: <span className="font-semibold text-primary tabular-nums">{formatCurrency(rev)}</span></p>
      <p className="text-neutral-600">Ocupação: <span className="font-semibold text-accent tabular-nums">{occ}%</span></p>
    </div>
  );
}

interface Props {
  hostId?: string;
  bookings?: Booking[];
  propertyCount: number;
}

export function RevenueOccupancyChart({ hostId, bookings, propertyCount }: Props) {
  const [months, setMonths] = useState(6);
  const { data: revenueData, isLoading } = useRevenueData(hostId, months);
  const occ = getMonthlyOccupancy(bookings, propertyCount, months);
  const data = (revenueData ?? []).map((d, i) => ({ ...d, occupancy: occ[i] ?? 0 }));

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Ocupação × Receita
        </h2>
        <div className="flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.v}
              onClick={() => setMonths(p.v)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                months === p.v ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-end justify-between gap-3 h-[220px] px-2 pt-4">
          {[55, 72, 48, 84, 63, 92].map((h, i) => (
            <Skeleton key={i} width="100%" height={`${h}%`} className="rounded-t-md rounded-b-none" />
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<ChartTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#1E3A5F" strokeWidth={2} fill="url(#revFill)" />
            <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#D4A017" strokeWidth={2} dot={{ r: 3, fill: '#D4A017' }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" />Receita</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent" />Ocupação</span>
      </div>
    </div>
  );
}
