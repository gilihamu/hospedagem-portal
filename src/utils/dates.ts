import {
  differenceInDays as dfnsDifferenceInDays,
  addDays as dfnsAddDays,
  format,
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function differenceInDays(dateLeft: Date | string, dateRight: Date | string): number {
  const left = typeof dateLeft === 'string' ? new Date(dateLeft) : dateLeft;
  const right = typeof dateRight === 'string' ? new Date(dateRight) : dateRight;
  return dfnsDifferenceInDays(left, right);
}

export function addDays(date: Date | string, amount: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dfnsAddDays(d, amount);
}

export function isDateAvailable(
  date: Date,
  bookedRanges: Array<{ start: Date; end: Date }>
): boolean {
  return !bookedRanges.some((range) =>
    isWithinInterval(date, { start: range.start, end: range.end })
  );
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  return `${format(s, 'dd MMM', { locale: ptBR })} - ${format(e, 'dd MMM yyyy', { locale: ptBR })}`;
}

export function getDatesInRange(start: Date | string, end: Date | string): Date[] {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  return eachDayOfInterval({ start: s, end: e });
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}
