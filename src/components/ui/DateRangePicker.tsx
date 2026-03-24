import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DateRangePickerProps {
  checkIn: string | null;
  checkOut: string | null;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  minDate?: Date;
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate = new Date(),
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'checkIn' | 'checkOut'>('checkIn');

  const today = startOfDay(new Date());
  const nextMonth = addMonths(currentMonth, 1);

  const checkInDate = checkIn ? new Date(checkIn + 'T00:00:00') : null;
  const checkOutDate = checkOut ? new Date(checkOut + 'T00:00:00') : null;

  function getDaysInMonth(month: Date) {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const startDow = start.getDay();
    return { days, startDow };
  }

  function handleDayClick(day: Date) {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (selecting === 'checkIn' || !checkInDate || isBefore(day, checkInDate)) {
      onCheckInChange(dayStr);
      onCheckOutChange('');
      setSelecting('checkOut');
    } else {
      onCheckOutChange(dayStr);
      setSelecting('checkIn');
    }
  }

  function isDisabled(day: Date) {
    return isBefore(startOfDay(day), startOfDay(minDate));
  }

  function isSelected(day: Date) {
    return (checkInDate && isSameDay(day, checkInDate)) ||
      (checkOutDate && isSameDay(day, checkOutDate));
  }

  function isInRange(day: Date) {
    if (!checkInDate || !checkOutDate) return false;
    return isWithinInterval(day, { start: checkInDate, end: checkOutDate });
  }

  function isRangeStart(day: Date) {
    return checkInDate ? isSameDay(day, checkInDate) : false;
  }

  function isRangeEnd(day: Date) {
    return checkOutDate ? isSameDay(day, checkOutDate) : false;
  }

  function isToday(day: Date) {
    return isSameDay(day, today);
  }

  function renderMonth(month: Date) {
    const { days, startDow } = getDaysInMonth(month);
    return (
      <div>
        <div className="text-sm font-semibold text-neutral-800 mb-3 text-center">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const disabled = isDisabled(day);
            const selected = isSelected(day);
            const inRange = isInRange(day);
            const rangeStart = isRangeStart(day);
            const rangeEnd = isRangeEnd(day);
            const todayDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'h-9 w-full text-sm transition-colors relative',
                  disabled && 'text-neutral-300 cursor-not-allowed',
                  !disabled && !selected && !inRange && 'text-neutral-700 hover:bg-primary/10 hover:text-primary rounded-full',
                  inRange && !rangeStart && !rangeEnd && 'bg-primary/10 text-primary',
                  selected && 'bg-primary text-white font-semibold rounded-full z-10',
                  rangeStart && 'rounded-r-none',
                  rangeEnd && 'rounded-l-none',
                  !rangeStart && !rangeEnd && inRange && 'rounded-none',
                  todayDay && !selected && 'font-bold'
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {renderMonth(currentMonth)}
        {renderMonth(nextMonth)}
      </div>
    </div>
  );
}
