import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Radio } from 'lucide-react';
import { useBookingsByChannel } from '../../hooks/useAnalytics';
import { Skeleton } from '../ui/Skeleton';

export function ChannelMixCard({ hostId }: { hostId?: string }) {
  const { data: channelData, isLoading } = useBookingsByChannel(hostId);
  const total = (channelData ?? []).reduce((s, c) => s + c.count, 0);

  return (
    <div className="card-base p-5">
      <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary" />
        Mix de canais
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Skeleton width="160px" height="160px" rounded />
        </div>
      ) : !channelData || channelData.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-10">Sem reservas por canal ainda</p>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="channel"
                  stroke="none"
                >
                  {channelData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} reservas`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-neutral-900 tabular-nums leading-none">{total}</span>
              <span className="text-xs text-neutral-500">reservas</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {channelData.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-1.5 text-xs text-neutral-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                {ch.channel}
                <span className="text-neutral-400 tabular-nums">
                  ({total > 0 ? Math.round((ch.count / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
