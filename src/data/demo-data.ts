import type {
  Activity,
  CalendarEvent,
  Contact,
  Deal,
  Employee,
  EntityByType,
  EntityCollection,
  Organization,
  Task,
} from '../types/domain';

const dateOffset = (days: number, hour = 12): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const hourOffsetToday = (hours: number): string => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(Math.min(23, date.getHours() + hours));
  return date.toISOString();
};

const today = (): string => dateOffset(0, 12);

const dateOnlyOffset = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export type DemoData = {
  [Collection in EntityCollection]: readonly EntityByType[Collection][];
};

const employees: Employee[] = [
  { id: 'employee-1', fullName: 'Мария Смирнова', email: 'maria@example.test', role: 'manager', avatarUrl: null },
  { id: 'employee-2', fullName: 'Илья Кузнецов', email: 'ilya@example.test', role: 'sales', avatarUrl: null },
  { id: 'employee-3', fullName: 'Анна Волкова', email: 'anna@example.test', role: 'sales', avatarUrl: null },
  { id: 'employee-4', fullName: 'Павел Соколов', email: 'pavel@example.test', role: 'support', avatarUrl: null },
];

const contacts: Contact[] = [
  { id: 'contact-1', fullName: 'Алексей Морозов', type: 'customer', status: 'active', phone: '+7 000 100-20-31', email: 'alexey@example.test', company: 'Северный ветер', source: 'website', assignedEmployeeId: 'employee-2', notes: 'Обсуждает расширение команды и новые рабочие процессы.', createdAt: dateOffset(-24) },
  { id: 'contact-2', fullName: 'Ольга Воронцова', type: 'customer', status: 'active', phone: '+7 000 100-20-32', email: 'olga@example.test', company: 'Маяк студия', source: 'referral', assignedEmployeeId: 'employee-3', notes: 'Предпочитает получать предложения по электронной почте.', createdAt: dateOffset(-21) },
  { id: 'contact-3', fullName: 'Дмитрий Лебедев', type: 'lead', status: 'active', phone: '+7 000 100-20-33', email: 'dmitry@example.test', company: 'Точка роста', source: 'advertising', assignedEmployeeId: 'employee-2', notes: 'Запросил демонстрацию и расчёт для отдела продаж.', createdAt: dateOffset(-17) },
  { id: 'contact-4', fullName: 'Екатерина Белова', type: 'partner', status: 'active', phone: '+7 000 100-20-34', email: 'ekaterina@example.test', company: 'Ладога сервис', source: 'social_media', assignedEmployeeId: 'employee-1', notes: 'Партнёр по внедрению решений для региональных команд.', createdAt: dateOffset(-15) },
  { id: 'contact-5', fullName: 'Сергей Павлов', type: 'lead', status: 'active', phone: '+7 000 100-20-35', email: 'sergey@example.test', company: 'Городские решения', source: 'website', assignedEmployeeId: 'employee-3', notes: 'Планирует запуск проекта в следующем квартале.', createdAt: dateOffset(-12) },
  { id: 'contact-6', fullName: 'Наталья Орлова', type: 'customer', status: 'inactive', phone: '+7 000 100-20-36', email: 'natalia@example.test', company: 'Форма и смысл', source: 'referral', assignedEmployeeId: 'employee-2', notes: 'Работа с компанией временно приостановлена.', createdAt: dateOffset(-9) },
  { id: 'contact-7', fullName: 'Михаил Фёдоров', type: 'lead', status: 'active', phone: '+7 000 100-20-37', email: 'mikhail@example.test', company: 'Новая линия', source: 'cold_call', assignedEmployeeId: 'employee-3', notes: 'Интересуется единой базой клиентов для команды.', createdAt: dateOffset(-5) },
  { id: 'contact-8', fullName: 'Ирина Захарова', type: 'customer', status: 'active', phone: '+7 000 100-20-38', email: 'irina@example.test', company: 'Тёплый дом', source: 'website', assignedEmployeeId: 'employee-1', notes: 'Ведёт проект по цифровизации клиентского сервиса.', createdAt: dateOffset(-2) },
];

const deals: Deal[] = [
  { id: 'deal-1', title: 'Внедрение CRM', contactId: 'contact-1', amount: 248000, currency: 'KZT', stageId: 'won', priority: 'high', expectedCloseDate: dateOnlyOffset(-2), assignedEmployeeId: 'employee-2', source: 'website', createdAt: dateOffset(-24), updatedAt: dateOffset(-1, 16), notes: 'Выполнено внедрение и обучение команды.' },
  { id: 'deal-2', title: 'Автоматизация отдела продаж', contactId: 'contact-2', amount: 186000, currency: 'KZT', stageId: 'negotiation', priority: 'high', expectedCloseDate: dateOnlyOffset(7), assignedEmployeeId: 'employee-3', source: 'referral', createdAt: dateOffset(-18), updatedAt: dateOffset(-1, 14), notes: 'Согласовать состав работ и сроки запуска.' },
  { id: 'deal-3', title: 'Лицензии для команды', contactId: 'contact-3', amount: 92000, currency: 'KZT', stageId: 'proposal', priority: 'medium', expectedCloseDate: dateOnlyOffset(12), assignedEmployeeId: 'employee-2', source: 'advertising', createdAt: dateOffset(-16), updatedAt: dateOffset(-2, 11), notes: 'Предложение подготовлено для отдела продаж.' },
  { id: 'deal-4', title: 'Настройка аналитики', contactId: 'contact-4', amount: 134000, currency: 'KZT', stageId: 'won', priority: 'medium', expectedCloseDate: dateOnlyOffset(-5), assignedEmployeeId: 'employee-1', source: 'social_media', createdAt: dateOffset(-14), updatedAt: dateOffset(-2, 10), notes: 'Настроены основные отчёты по воронке.' },
  { id: 'deal-5', title: 'Поддержка и обучение', contactId: 'contact-5', amount: 76000, currency: 'KZT', stageId: 'qualification', priority: 'low', expectedCloseDate: dateOnlyOffset(18), assignedEmployeeId: 'employee-3', source: 'website', createdAt: dateOffset(-11), updatedAt: dateOffset(-3, 15), notes: 'Уточнить число участников обучения.' },
  { id: 'deal-6', title: 'Расширение лицензий', contactId: 'contact-6', amount: 158000, currency: 'KZT', stageId: 'won', priority: 'medium', expectedCloseDate: dateOnlyOffset(-8), assignedEmployeeId: 'employee-2', source: 'referral', createdAt: dateOffset(-9), updatedAt: dateOffset(-3, 12), notes: 'Заказчик расширил тариф для команды.' },
  { id: 'deal-7', title: 'Единая база клиентов', contactId: 'contact-7', amount: 212000, currency: 'KZT', stageId: 'proposal', priority: 'high', expectedCloseDate: dateOnlyOffset(15), assignedEmployeeId: 'employee-3', source: 'cold_call', createdAt: dateOffset(-6), updatedAt: dateOffset(-1, 9), notes: 'Подготовить план переноса текущей базы.' },
  { id: 'deal-8', title: 'Цифровой офис', contactId: 'contact-8', amount: 118000, currency: 'KZT', stageId: 'new', priority: 'low', expectedCloseDate: dateOnlyOffset(25), assignedEmployeeId: 'employee-1', source: 'website', createdAt: dateOffset(-2), updatedAt: dateOffset(-1, 13), notes: 'Первичный запрос через сайт.' },
  { id: 'deal-9', title: 'Воронка для партнёров', contactId: 'contact-2', amount: 97000, currency: 'KZT', stageId: 'lost', priority: 'low', expectedCloseDate: dateOnlyOffset(-6), assignedEmployeeId: 'employee-3', source: 'referral', createdAt: dateOffset(-19), updatedAt: dateOffset(-5, 15), notes: 'Проект отложен до следующего квартала.' },
  { id: 'deal-10', title: 'Интеграция с сервисами', contactId: 'contact-5', amount: 143000, currency: 'KZT', stageId: 'new', priority: 'high', expectedCloseDate: dateOnlyOffset(10), assignedEmployeeId: 'employee-2', source: 'website', createdAt: dateOffset(-1), updatedAt: today(), notes: 'Обсудить интеграцию с внутренними инструментами.' },
];

const tasks: Task[] = [
  { id: 'task-1', title: 'Подготовить предложение', description: 'Для встречи с командой «Маяк студия».', dueDate: hourOffsetToday(1), priority: 'high', status: 'in_progress', assignedEmployeeId: 'employee-3', relatedDealId: 'deal-2', relatedContactId: 'contact-2', createdAt: dateOffset(-2) },
  { id: 'task-2', title: 'Позвонить Алексею', description: 'Уточнить состав команды и сроки.', dueDate: hourOffsetToday(2), priority: 'medium', status: 'pending', assignedEmployeeId: 'employee-2', relatedDealId: 'deal-1', relatedContactId: 'contact-1', createdAt: dateOffset(-1) },
  { id: 'task-3', title: 'Проверить смету', description: 'Согласовать этапы запуска.', dueDate: hourOffsetToday(3), priority: 'urgent', status: 'pending', assignedEmployeeId: 'employee-1', relatedDealId: 'deal-3', relatedContactId: 'contact-3', createdAt: today() },
  { id: 'task-4', title: 'Отправить материалы по аналитике', description: 'Приложить краткую презентацию.', dueDate: dateOffset(1, 11), priority: 'low', status: 'pending', assignedEmployeeId: 'employee-1', relatedDealId: 'deal-4', relatedContactId: 'contact-4', createdAt: dateOffset(-1) },
  { id: 'task-5', title: 'Согласовать дату обучения', description: 'Предложить два удобных времени.', dueDate: dateOffset(2, 14), priority: 'medium', status: 'pending', assignedEmployeeId: 'employee-3', relatedDealId: 'deal-5', relatedContactId: 'contact-5', createdAt: today() },
  { id: 'task-6', title: 'Подготовить список лицензий', description: 'Проверить количество активных пользователей.', dueDate: dateOffset(3, 12), priority: 'medium', status: 'pending', assignedEmployeeId: 'employee-2', relatedDealId: 'deal-6', relatedContactId: 'contact-6', createdAt: dateOffset(-1) },
  { id: 'task-7', title: 'Обновить карточку клиента', description: 'Добавить итоги разговора.', dueDate: dateOffset(-1, 15), priority: 'low', status: 'completed', assignedEmployeeId: 'employee-3', relatedDealId: null, relatedContactId: 'contact-7', createdAt: dateOffset(-3) },
];

const calendarEvents: CalendarEvent[] = [
  { id: 'event-1', title: 'Встреча с командой «Маяк»', description: 'Обсуждение предложения и следующих шагов.', startAt: hourOffsetToday(2), endAt: hourOffsetToday(3), relatedContactId: 'contact-2', relatedDealId: 'deal-2', type: 'meeting', assignedEmployeeId: 'employee-3', location: 'Онлайн', createdAt: dateOffset(-2), updatedAt: today() },
  { id: 'event-2', title: 'Демо для «Городских решений»', description: 'Показ возможностей CRM.', startAt: dateOffset(1, 11), endAt: dateOffset(1, 12), relatedContactId: 'contact-5', relatedDealId: 'deal-5', type: 'consultation', assignedEmployeeId: 'employee-3', location: 'Переговорная 2', createdAt: dateOffset(-1), updatedAt: today() },
  { id: 'event-3', title: 'Планирование команды', description: 'Еженедельная встреча отдела.', startAt: dateOffset(3, 10), endAt: dateOffset(3, 11), relatedContactId: null, relatedDealId: null, type: 'meeting', assignedEmployeeId: 'employee-1', location: 'Офис', createdAt: today(), updatedAt: today() },
  { id: 'event-4', title: 'Звонок по смете', description: 'Согласовать детали расчёта.', startAt: dateOffset(2, 15), endAt: dateOffset(2, 16), relatedContactId: 'contact-3', relatedDealId: 'deal-3', type: 'call', assignedEmployeeId: 'employee-2', location: '', createdAt: today(), updatedAt: today() },
  { id: 'event-5', title: 'Напоминание: отправить материалы', description: 'Подготовить и отправить презентацию.', startAt: dateOffset(4, 9), endAt: dateOffset(4, 9.5), relatedContactId: 'contact-4', relatedDealId: 'deal-4', type: 'reminder', assignedEmployeeId: 'employee-1', location: '', createdAt: today(), updatedAt: today() },
];

const activities: Activity[] = [
  { id: 'activity-1', type: 'status_changed', description: 'Сделка «Внедрение CRM» переведена в успешные.', entityId: 'deal-1', entityType: 'deal', createdAt: dateOffset(-1, 16), employeeId: 'employee-2' },
  { id: 'activity-2', type: 'created', description: 'Добавлен новый контакт — Ирина Захарова.', entityId: 'contact-8', entityType: 'contact', createdAt: dateOffset(-1, 13), employeeId: 'employee-1' },
  { id: 'activity-3', type: 'updated', description: 'Обновлено предложение по автоматизации продаж.', entityId: 'deal-2', entityType: 'deal', createdAt: dateOffset(-1, 11), employeeId: 'employee-3' },
  { id: 'activity-4', type: 'completed', description: 'Завершена задача «Обновить карточку клиента».', entityId: 'task-7', entityType: 'task', createdAt: dateOffset(-1, 9), employeeId: 'employee-3' },
  { id: 'activity-5', type: 'created', description: 'Создана сделка «Интеграция с сервисами».', entityId: 'deal-10', entityType: 'deal', createdAt: today(), employeeId: 'employee-2' },
  { id: 'activity-6', type: 'commented', description: 'Добавлена заметка по встрече с «Точкой роста».', entityId: 'deal-3', entityType: 'deal', createdAt: dateOffset(-2, 15), employeeId: 'employee-2' },
];

const organizations: Organization[] = [
  { id: 'organization-1', name: 'FlowCRM Демо', businessType: 'Демонстрационная команда', currency: 'KZT' },
];

export const demoData: DemoData = {
  contacts,
  deals,
  tasks,
  calendarEvents,
  employees,
  activities,
  organizations,
};
