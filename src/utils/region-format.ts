import type { AppSettings } from '../types/settings';

type DateOptions = { time?: boolean; day?: boolean; weekday?: 'short' | 'long'; month?: 'short' | 'long' | 'numeric'; year?: boolean };
let locale: AppSettings['locale'] = 'ru-KZ';
let dateFormat: AppSettings['dateFormat'] = 'locale';
let timeFormat: AppSettings['timeFormat'] = '24h';
let timeZone = 'Asia/Qyzylorda';

export function configureRegionFormat(settings: Pick<AppSettings, 'locale' | 'dateFormat' | 'timeFormat' | 'timeZone'>): void {
  locale = settings.locale; dateFormat = settings.dateFormat; timeFormat = settings.timeFormat; timeZone = settings.timeZone;
}

function normalizeDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12));
  return new Date(value);
}

export function formatRegionDate(value: Date | string, options: DateOptions = {}): string {
  const date = normalizeDate(value);
  const formattingZone = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'UTC' : timeZone;
  const fields: Intl.DateTimeFormatOptions = {
    day: options.day === false ? undefined : 'numeric', month: options.month ?? (dateFormat === 'locale' ? 'short' : '2-digit'),
    year: options.year === false ? undefined : 'numeric', weekday: options.weekday,
    timeZone: formattingZone,
  };
  const formatted = new Intl.DateTimeFormat(locale, fields).format(date);
  if (dateFormat === 'locale' || options.weekday || options.month === 'long' || options.day === false) {
    return options.time ? `${formatted}, ${formatRegionTime(date)}` : formatted;
  }
  const parts = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: formattingZone }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const datePart = dateFormat === 'dd.MM.yyyy' ? `${values.day}.${values.month}.${values.year}` : dateFormat === 'MM/dd/yyyy' ? `${values.month}/${values.day}/${values.year}` : `${values.year}-${values.month}-${values.day}`;
  return options.time ? `${datePart}, ${formatRegionTime(date)}` : datePart;
}

export function formatRegionTime(value: Date | string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h', timeZone }).format(normalizeDate(value));
}
