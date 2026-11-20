import type { ContactStatus, ContactType } from '../types/domain';

export const contactTypeLabels: Record<ContactType, string> = {
  lead: 'Потенциальный клиент',
  customer: 'Клиент',
  partner: 'Партнёр',
};

export const contactStatusLabels: Record<ContactStatus, string> = {
  active: 'Активный',
  inactive: 'Неактивный',
};

export const contactDateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
