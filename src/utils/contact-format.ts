import type { ContactStatus, ContactType } from '../types/domain';
import { formatRegionDate } from './region-format';

export const contactTypeLabels: Record<ContactType, string> = {
  lead: 'Потенциальный клиент',
  customer: 'Клиент',
  partner: 'Партнёр',
};

export const contactStatusLabels: Record<ContactStatus, string> = {
  active: 'Активный',
  inactive: 'Неактивный',
};

export const contactDateFormat = { format: (date: Date) => formatRegionDate(date, { month: 'short' }) };
