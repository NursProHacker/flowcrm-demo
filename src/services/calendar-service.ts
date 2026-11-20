import { services } from './repositories';
import type { CalendarEvent } from '../types/domain';

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>;

async function validate(input: CalendarEventInput): Promise<void> {
  const [contacts, deals, employees] = await Promise.all([
    services.contacts.getAll(), services.deals.getAll(), services.employees.getAll(),
  ]);
  if (!input.title.trim()) throw new Error('Введите название события.');
  const start = Date.parse(input.startAt); const end = Date.parse(input.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Укажите корректную дату и время.');
  if (end <= start) throw new Error('Время окончания должно быть позже начала.');
  if (input.assignedEmployeeId && !employees.some((employee) => employee.id === input.assignedEmployeeId)) throw new Error('Выбранный сотрудник не найден.');
  if (input.relatedContactId && !contacts.some((contact) => contact.id === input.relatedContactId)) throw new Error('Выбранный контакт не найден.');
  if (input.relatedDealId && !deals.some((deal) => deal.id === input.relatedDealId)) throw new Error('Выбранная сделка не найдена.');
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  await validate(input);
  const now = new Date().toISOString();
  return services.calendarEvents.create({ ...input, title: input.title.trim(), id: `event-${crypto.randomUUID()}`, createdAt: now, updatedAt: now });
}

export async function updateCalendarEvent(id: string, input: CalendarEventInput): Promise<CalendarEvent> {
  await validate(input);
  return services.calendarEvents.update(id, { ...input, title: input.title.trim(), updatedAt: new Date().toISOString() });
}
