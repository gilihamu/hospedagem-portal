import { PlaneLanding, PlaneTakeoff } from 'lucide-react';
import type { Booking } from '../../types';
import type { TodayOps } from '../../utils/hotelMetrics';

function MovementRow({ b }: { b: Booking }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-surface-muted">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-800 truncate">{b.guestName}</p>
        <p className="text-xs text-neutral-400 truncate">
          {b.propertyName} · {b.guests} hóspede{b.guests > 1 ? 's' : ''}
        </p>
      </div>
      <span className="text-xs font-semibold text-primary tabular-nums flex-shrink-0">{b.confirmationCode}</span>
    </div>
  );
}

export function TodayMovement({ ops }: { ops: TodayOps }) {
  const empty = ops.arrivals.length === 0 && ops.departures.length === 0;

  return (
    <div className="card-base p-5">
      <h2 className="font-semibold text-neutral-800 mb-4">Movimentação de hoje</h2>
      {empty ? (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3">
            <PlaneLanding className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-700">Sem chegadas ou saídas hoje</p>
          <p className="text-xs text-neutral-400">Dia tranquilo por aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <PlaneLanding className="w-4 h-4 text-success" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Chegadas ({ops.arrivals.length})
              </h3>
            </div>
            {ops.arrivals.length === 0 ? (
              <p className="text-xs text-neutral-400 py-1">Nenhuma chegada hoje</p>
            ) : (
              <div>{ops.arrivals.slice(0, 4).map((b) => <MovementRow key={b.id} b={b} />)}</div>
            )}
          </section>
          <section>
            <div className="flex items-center gap-2 mb-1.5">
              <PlaneTakeoff className="w-4 h-4 text-info" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Saídas ({ops.departures.length})
              </h3>
            </div>
            {ops.departures.length === 0 ? (
              <p className="text-xs text-neutral-400 py-1">Nenhuma saída hoje</p>
            ) : (
              <div>{ops.departures.slice(0, 4).map((b) => <MovementRow key={b.id} b={b} />)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
