import { services } from './repositories';
import type { Task, TaskPriority, TaskStatus } from '../types/domain';

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export const taskStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'Ожидает', in_progress: 'В работе', completed: 'Выполнена', cancelled: 'Отменена',
};
export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный',
};

export function isTaskOverdue(task: Task, now = new Date()): boolean {
  return task.status !== 'completed' && task.status !== 'cancelled' && Date.parse(task.dueDate) < now.getTime();
}

export async function createTask(input: TaskInput): Promise<Task> {
  const [contacts, deals, employees] = await Promise.all([
    services.contacts.getAll(), services.deals.getAll(), services.employees.getAll(),
  ]);
  if (!input.title.trim() || !Number.isFinite(Date.parse(input.dueDate))) throw new Error('Проверьте название задачи и срок.');
  if (!employees.some((employee) => employee.id === input.assignedEmployeeId)) throw new Error('Выберите ответственного сотрудника.');
  if (input.relatedContactId && !contacts.some((contact) => contact.id === input.relatedContactId)) throw new Error('Выбранный контакт не найден.');
  if (input.relatedDealId && !deals.some((deal) => deal.id === input.relatedDealId)) throw new Error('Выбранная сделка не найдена.');
  const now = new Date().toISOString();
  return services.tasks.create({ ...input, title: input.title.trim(), id: `task-${crypto.randomUUID()}`, createdAt: now, updatedAt: now });
}

export async function updateTask(id: string, changes: TaskInput): Promise<Task> {
  const [contacts, deals, employees] = await Promise.all([
    services.contacts.getAll(), services.deals.getAll(), services.employees.getAll(),
  ]);
  if (!changes.title.trim() || !Number.isFinite(Date.parse(changes.dueDate))) throw new Error('Проверьте название задачи и срок.');
  if (!employees.some((employee) => employee.id === changes.assignedEmployeeId)) throw new Error('Выберите ответственного сотрудника.');
  if (changes.relatedContactId && !contacts.some((contact) => contact.id === changes.relatedContactId)) throw new Error('Выбранный контакт не найден.');
  if (changes.relatedDealId && !deals.some((deal) => deal.id === changes.relatedDealId)) throw new Error('Выбранная сделка не найдена.');
  return services.tasks.update(id, { ...changes, title: changes.title.trim(), updatedAt: new Date().toISOString() });
}
