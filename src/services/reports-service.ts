import type { Deal, DealStage, Employee, TaskPriority } from '../types/domain';
import { isTaskOverdue } from './task-service';
import type { Services } from './repositories';
import { formatRegionDate } from '../utils/region-format';

export type ReportRange = { start: Date; end: Date };
export interface ReportPeriodData {
  range: ReportRange;
  previousRange: ReportRange;
  comparisonAvailable: boolean;
  summary: { revenue: number; wonDeals: number; activeDeals: number; averageCheck: number; conversion: number };
  previous: { revenue: number; wonDeals: number; activeDeals: number; averageCheck: number; conversion: number };
  revenue: Array<{ date: string; label: string; amount: number }>;
  funnel: Array<{ stage: DealStage; label: string; count: number; amount: number; share: number }>;
  employees: Array<{ id: string; name: string; deals: number; wins: number; revenue: number; tasks: number; completedTasks: number; completionRate: number }>;
  tasks: { total: number; completed: number; pending: number; overdue: number; completionRate: number; priorities: Array<{ priority: TaskPriority; label: string; count: number }> };
}

const stageLabels: Record<DealStage, string> = { new: 'Новая', qualification: 'Квалификация', proposal: 'Предложение', negotiation: 'Переговоры', won: 'Успешно', lost: 'Закрыта' };
const priorityLabels: Record<TaskPriority, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный' };
const stages: DealStage[] = ['new', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(value);
const inRange = (value: string | undefined, range: ReportRange) => !!value && Number.isFinite(parseDate(value).getTime()) && parseDate(value) >= range.start && parseDate(value) <= range.end;

function summarize(createdDeals: Deal[], allDeals: Deal[], range: ReportRange): ReportPeriodData['summary'] {
  const closed = allDeals.filter((deal) => (deal.stageId === 'won' || deal.stageId === 'lost') && inRange(deal.updatedAt, range));
  const won = closed.filter((deal) => deal.stageId === 'won');
  return {
    revenue: won.reduce((sum, deal) => sum + deal.amount, 0),
    wonDeals: won.length,
    activeDeals: createdDeals.filter((deal) => deal.stageId !== 'won' && deal.stageId !== 'lost').length,
    averageCheck: won.length ? won.reduce((sum, deal) => sum + deal.amount, 0) / won.length : 0,
    conversion: closed.length ? (won.length / closed.length) * 100 : 0,
  };
}

export async function getReportsData(services: Services, range: ReportRange, now = new Date()): Promise<ReportPeriodData> {
  const [deals, tasks, employees] = await Promise.all([services.deals.getAll(), services.tasks.getAll(), services.employees.getAll()]);
  const span = range.end.getTime() - range.start.getTime() + 1;
  const previousRange = { start: new Date(range.start.getTime() - span), end: new Date(range.start.getTime() - 1) };
  const periodDeals = deals.filter((deal) => inRange(deal.createdAt, range));
  const previousDeals = deals.filter((deal) => inRange(deal.createdAt, previousRange));
  const summary = summarize(periodDeals, deals, range);
  const previous = summarize(previousDeals, deals, previousRange);
  const windowDays = Math.ceil(span / 86400000);
  const bucket: 'day' | 'week' | 'month' = windowDays <= 31 ? 'day' : windowDays <= 100 ? 'week' : 'month';
  const points = new Map<string, { date: Date; amount: number }>();
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= range.end) {
    const pointDate = new Date(cursor);
    if (bucket === 'week') pointDate.setDate(pointDate.getDate() - ((pointDate.getDay() + 6) % 7));
    if (bucket === 'month') pointDate.setDate(1);
    const key = dateKey(pointDate);
    if (!points.has(key)) points.set(key, { date: pointDate, amount: 0 });
    cursor.setDate(cursor.getDate() + (bucket === 'day' ? 1 : bucket === 'week' ? 7 : 1));
    if (bucket === 'month') {
      cursor.setDate(1);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  for (const deal of deals) {
    if (deal.stageId !== 'won' || !inRange(deal.updatedAt, range)) continue;
    const closedDate = parseDate(deal.updatedAt);
    if (bucket === 'week') closedDate.setDate(closedDate.getDate() - ((closedDate.getDay() + 6) % 7));
    if (bucket === 'month') closedDate.setDate(1);
    const point = points.get(dateKey(closedDate));
    if (point) point.amount += deal.amount;
  }
  const revenue = [...points.entries()].map(([date, point]) => ({ date, label: formatRegionDate(point.date, { month: 'short', year: false }), amount: point.amount }));
  const funnel = stages.map((stage) => {
    const matching = periodDeals.filter((deal) => deal.stageId === stage);
    return { stage, label: stageLabels[stage], count: matching.length, amount: matching.reduce((sum, deal) => sum + deal.amount, 0), share: periodDeals.length ? matching.length / periodDeals.length * 100 : 0 };
  });
  const periodTasks = tasks.filter((task) => inRange(task.createdAt, range));
  const tasksCompleted = periodTasks.filter((task) => task.status === 'completed').length;
  const employeesData = employees.map((employee: Employee) => {
    const ownedDeals = periodDeals.filter((deal) => deal.assignedEmployeeId === employee.id);
    const won = deals.filter((deal) => deal.assignedEmployeeId === employee.id && deal.stageId === 'won' && inRange(deal.updatedAt, range));
    const assignedTasks = periodTasks.filter((task) => task.assignedEmployeeId === employee.id);
    const completed = assignedTasks.filter((task) => task.status === 'completed');
    return { id: employee.id, name: employee.fullName, deals: ownedDeals.length, wins: won.length, revenue: won.reduce((sum, deal) => sum + deal.amount, 0), tasks: assignedTasks.length, completedTasks: completed.length, completionRate: assignedTasks.length ? completed.length / assignedTasks.length * 100 : 0 };
  }).sort((a, b) => b.revenue - a.revenue || b.wins - a.wins);
  const relevantTasks = periodTasks;
  return {
    range, previousRange,
    comparisonAvailable: deals.some((deal) => inRange(deal.createdAt, previousRange)),
    summary, previous, revenue, funnel, employees: employeesData,
    tasks: {
      total: relevantTasks.length, completed: tasksCompleted,
      pending: relevantTasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').length,
      overdue: relevantTasks.filter((task) => isTaskOverdue(task, now)).length,
      completionRate: relevantTasks.length ? tasksCompleted / relevantTasks.length * 100 : 0,
      priorities: (['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((priority) => ({ priority, label: priorityLabels[priority], count: relevantTasks.filter((task) => task.priority === priority).length })),
    },
  };
}
