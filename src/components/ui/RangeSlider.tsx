import { useState, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  className?: string;
  step?: number;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatLabel = formatCurrency,
  className,
  step = 1,
}: RangeSliderProps) {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newValue = Math.round((min + percent * (max - min)) / step) * step;

      const distToMin = Math.abs(newValue - value[0]);
      const distToMax = Math.abs(newValue - value[1]);

      if (distToMin <= distToMax) {
        onChange([Math.min(newValue, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(newValue, value[0] + step)]);
      }
    },
    [min, max, step, value, onChange]
  );

  const minPercent = getPercent(value[0]);
  const maxPercent = getPercent(value[1]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm font-medium text-neutral-700 mb-3">
        <span>{formatLabel(value[0])}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-1.5 bg-neutral-200 rounded-full cursor-pointer"
        onClick={handleTrackClick}
      >
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Math.min(v, value[1] - step), value[1]]);
          }}
          onMouseDown={() => setDragging('min')}
          onMouseUp={() => setDragging(null)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: dragging === 'min' ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([value[0], Math.max(v, value[0] + step)]);
          }}
          onMouseDown={() => setDragging('max')}
          onMouseUp={() => setDragging(null)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: dragging === 'max' ? 5 : 4 }}
        />
        {/* Visible thumbs */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -mt-1.5 -ml-2 shadow-sm pointer-events-none"
          style={{ left: `${minPercent}%`, top: '50%', transform: 'translateY(-50%)' }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -mt-1.5 -ml-2 shadow-sm pointer-events-none"
          style={{ left: `${maxPercent}%`, top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </div>
  );
}
