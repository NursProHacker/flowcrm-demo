import type { Activity, CalendarEvent, Contact, Deal, DealStage, Employee, Task } from '../types/domain';
import type { Services } from './repositories';

export interface DealStatusSummary {
  stage: DealStage;
  label: string;
  count: number;
  color: string;
}

export interface SalesPoint {
  date: string;
  label: string;
  amount: number;
}

export interface RecentDealItem {
  deal: Deal;
  contact: Contact | null;
  employee: Employee | null;
}

export interface DashboardSnapshot {
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  employees: Employee[];
  calendarEvents: CalendarEvent[];
  activities: Activity[];
  contactsCount: number;
  activeDealsCount: number;
  revenue: number;
  tasksDueTodayCount: number;
  sales: SalesPoint[];
  dealStatuses: DealStatusSummary[];
  recentDeals: RecentDealItem[];
  upcomingTasks: Task[];
  recentActivities: Activity[];
}

const stageDetails: ReadonlyArray<{ stage: DealStage; label: string; color: string }> = [
  { stage: 'new', label: 'Новая', color: '#93c5fd' },
  { stage: 'qualification', label: 'Квалификация', color: '#60a5fa' },
  { stage: 'proposal', label: 'Предложение', color: '#3b82f6' },
  { stage: 'negotiation', label: 'Переговоры', color: '#2563eb' },
  { stage: 'won', label: 'Успешно', color: '#16a34a' },
  { stage: 'lost', label: 'Закрыта', color: '#cbd5e1' },
];

const dayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function getDashboardSnapshot(
  dataServices: Services,
  currentDate = new Date(),
): Promise<DashboardSnapshot> {
  const [contacts, deals, tasks, employees, activities] = await Promise.all([
    dataServices.contacts.getAll(),
    dataServices.deals.getAll(),
    dataServices.tasks.getAll(),
    dataServices.employees.getAll(),
    dataServices.activities.getAll(),
  ]);
  const calendarEvents = await dataServices.calendarEvents.getAll();

  const todayKey = dayKey(currentDate);
  const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const recentWindow = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfToday);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const sales = recentWindow.map((date) => {
    const key = dayKey(date);
    const amount = deals
      .filter((deal) => deal.stageId === 'won' && dayKey(new Date(deal.updatedAt)) === key)
      .reduce((sum, deal) => sum + deal.amount, 0);

    return {
      date: key,
      label: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date),
      amount,
    };
  });

  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const tasksDueTodayCount = tasks.filter(
    (task) => dayKey(new Date(task.dueDate)) === todayKey && task.status !== 'completed' && task.status !== 'cancelled',
  ).length;

  return {
    contacts,
    deals,
    tasks,
    employees,
    calendarEvents,
    activities,
    contactsCount: contacts.length,
    activeDealsCount: deals.filter((deal) => deal.stageId !== 'won' && deal.stageId !== 'lost').length,
    revenue: deals.filter((deal) => deal.stageId === 'won').reduce((sum, deal) => sum + deal.amount, 0),
    tasksDueTodayCount,
    sales,
    dealStatuses: stageDetails.map(({ stage, label, color }) => ({
      stage,
      label,
      color,
      count: deals.filter((deal) => deal.stageId === stage).length,
    })),
    recentDeals: [...deals]
      .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
      .slice(0, 6)
      .map((deal) => ({
        deal,
        contact: contactsById.get(deal.contactId) ?? null,
        employee: employeesById.get(deal.assignedEmployeeId) ?? null,
      })),
    upcomingTasks: [...tasks]
      .filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= startOfToday && dueDate <= endOfWeek && task.status !== 'completed' && task.status !== 'cancelled';
      })
      .sort((first, second) => Date.parse(first.dueDate) - Date.parse(second.dueDate))
      .slice(0, 5),
    recentActivities: [...activities]
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
      .slice(0, 5),
  };
}
