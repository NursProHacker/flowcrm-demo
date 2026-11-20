import type { Activity, Deal, DealPriority, DealStage } from '../types/domain';
import { services } from './repositories';
import { getDealStageLabel } from '../utils/deal-format';

export type NewDeal = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>;
export type DealChanges = Partial<Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>>;

interface LegacyDealFields {
  priority?: DealPriority;
  expectedCloseDate?: string | null;
}

function createId(prefix: string): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function normalizeStoredDeal(stored: Deal): Promise<Deal> {
  const legacyDeal = stored as Deal & LegacyDealFields;
  const normalized: Deal = {
    ...stored,
    priority: legacyDeal.priority ?? 'medium',
    expectedCloseDate: legacyDeal.expectedCloseDate ?? null,
  };
  if (legacyDeal.priority === undefined || legacyDeal.expectedCloseDate === undefined) {
    await services.deals.update(stored.id, {
      priority: normalized.priority,
      expectedCloseDate: normalized.expectedCloseDate,
    });
  }
  return normalized;
}

async function addActivity(deal: Deal, type: Activity['type'], description: string): Promise<Activity> {
  return services.activities.create({
    id: createId('activity'),
    type,
    description,
    entityId: deal.id,
    entityType: 'deal',
    createdAt: new Date().toISOString(),
    employeeId: deal.assignedEmployeeId,
  });
}

export const dealService = {
  async getAll(): Promise<Deal[]> {
    const storedDeals = await services.deals.getAll();
    const normalizedDeals: Deal[] = [];
    for (const storedDeal of storedDeals) normalizedDeals.push(await normalizeStoredDeal(storedDeal));
    return normalizedDeals.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  },

  async getById(id: string): Promise<Deal | null> {
    const deal = await services.deals.getById(id);
    return deal ? normalizeStoredDeal(deal) : null;
  },

  async getHistory(id: string): Promise<Activity[]> {
    const activities = await services.activities.getAll();
    return activities
      .filter((activity) => activity.entityType === 'deal' && activity.entityId === id)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  },

  async create(values: NewDeal): Promise<Deal> {
    const [contact, employee] = await Promise.all([
      services.contacts.getById(values.contactId),
      services.employees.getById(values.assignedEmployeeId),
    ]);
    if (!contact) throw new Error('Выберите существующий контакт.');
    if (!employee) throw new Error('Выберите ответственного сотрудника.');

    const now = new Date().toISOString();
    const deal: Deal = {
      ...values,
      id: createId('deal'),
      createdAt: now,
      updatedAt: now,
    };
    const created = await services.deals.create(deal);
    await addActivity(created, 'created', `Создана сделка «${created.title}».`);
    return created;
  },

  async update(id: string, changes: DealChanges): Promise<Deal> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Сделка не найдена. Обновите список и попробуйте снова.');

    if (changes.contactId) {
      const contact = await services.contacts.getById(changes.contactId);
      if (!contact) throw new Error('Выбранный контакт больше не существует.');
    }
    if (changes.assignedEmployeeId) {
      const employee = await services.employees.getById(changes.assignedEmployeeId);
      if (!employee) throw new Error('Выбранный сотрудник больше не существует.');
    }

    const updated = await services.deals.update(id, { ...changes, updatedAt: new Date().toISOString() });
    const events: Array<{ type: Activity['type']; description: string }> = [];
    if (changes.stageId && changes.stageId !== existing.stageId) {
      events.push({
        type: 'status_changed',
        description: `Этап сделки «${updated.title}»: «${getDealStageLabel(existing.stageId)}» → «${getDealStageLabel(updated.stageId)}».`,
      });
    }
    if (changes.assignedEmployeeId && changes.assignedEmployeeId !== existing.assignedEmployeeId) {
      const employees = await services.employees.getAll();
      const previousName = employees.find((employee) => employee.id === existing.assignedEmployeeId)?.fullName ?? 'Не назначен';
      const nextName = employees.find((employee) => employee.id === updated.assignedEmployeeId)?.fullName ?? 'Не назначен';
      events.push({ type: 'updated', description: `Ответственный по сделке «${updated.title}»: ${previousName} → ${nextName}.` });
    }
    const hasOtherChanges = Object.keys(changes).some((key) => key !== 'stageId' && key !== 'assignedEmployeeId');
    if (hasOtherChanges) {
      events.push({ type: 'updated', description: `Обновлены данные сделки «${updated.title}».` });
    }
    for (const event of events) await addActivity(updated, event.type, event.description);
    return updated;
  },

  async changeStage(id: string, stageId: DealStage): Promise<Deal> {
    return this.update(id, { stageId });
  },

  delete(id: string): Promise<void> {
    return services.deals.delete(id);
  },
};
