import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
const displayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseValue = (value: string) => {
  const [datePart, timePart = '10:00'] = value.split('T');
  const [year = 2000, month = 1, day = 1] = (datePart ?? '').split('-').map(Number);
  const [hour = 10, minute = 0] = timePart.split(':').map(Number);
  return { date: new Date(year, month - 1, day), hour, minute };
};
const composeValue = (date: Date, hour: number, minute: number) => `${dateKey(date)}T${pad(hour)}:${pad(minute)}`;

export function DateTimePicker({ label, value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selected = parseValue(value);
  const [todayKey] = useState(() => dateKey(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.date.getFullYear(), selected.date.getMonth(), 1));
  const weekStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  const dates = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const changeDate = (date: Date) => onChange(composeValue(date, selected.hour, selected.minute));
  const changeTime = (hour: number, minute: number) => onChange(composeValue(selected.date, hour, minute));
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const minutes = Array.from({ length: 60 }, (_, minute) => minute);

  return <div className={`contact-field calendar-datetime-field${open ? ' calendar-datetime-field--open' : ''}`}>
    <span>{label} <i>*</i></span>
    <div className="calendar-datetime-picker" ref={pickerRef}>
      <button ref={buttonRef} className="calendar-datetime-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setVisibleMonth(new Date(selected.date.getFullYear(), selected.date.getMonth(), 1)); setOpen((current) => !current); }}>
        <CalendarDays size={16} aria-hidden="true"/><strong>{displayFormatter.format(selected.date)}</strong><span><Clock3 size={14} aria-hidden="true"/>{pad(selected.hour)}:{pad(selected.minute)}</span>
      </button>
      {open && <div className="calendar-datetime-popover" role="dialog" aria-label={`Выбор даты и времени: ${label}`}>
        <div className="calendar-picker-month"><button type="button" aria-label="Предыдущий месяц" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={17}/></button><strong>{monthFormatter.format(visibleMonth)}</strong><button type="button" aria-label="Следующий месяц" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={17}/></button></div>
        <div className="calendar-picker-layout"><div className="calendar-picker-date"><div className="calendar-picker-weekdays">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-picker-days">{dates.map((date) => { const key = dateKey(date); const isSelected = key === dateKey(selected.date); return <button key={key} type="button" className={`${date.getMonth() !== visibleMonth.getMonth() ? 'calendar-picker-day--outside ' : ''}${isSelected ? 'calendar-picker-day--selected ' : ''}${key === todayKey ? 'calendar-picker-day--today' : ''}`} aria-pressed={isSelected} onClick={() => changeDate(date)}>{date.getDate()}</button>; })}</div><button className="calendar-picker-today" type="button" onClick={() => changeDate(new Date())}>Сегодня</button></div>
          <div className="calendar-picker-time"><span className="calendar-picker-time__label">Время</span><div className="calendar-picker-time__controls"><label><span className="sr-only">Часы</span><select value={selected.hour} onChange={(event) => changeTime(Number(event.target.value), selected.minute)}>{hours.map((hour) => <option value={hour} key={hour}>{pad(hour)}</option>)}</select></label><span>:</span><label><span className="sr-only">Минуты</span><select value={selected.minute} onChange={(event) => changeTime(selected.hour, Number(event.target.value))}>{minutes.map((minute) => <option value={minute} key={minute}>{pad(minute)}</option>)}</select></label></div><small>Выберите час и минуты</small></div>
        </div>
      </div>}
    </div>
  </div>;
}
