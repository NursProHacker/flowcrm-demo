import type { DealPriority, DealStage } from '../types/domain';
import { formatCurrency } from './currency';

export const dealStageOptions: Array<{ value: DealStage; label: string }> = [
  { value: 'new', label: 'Новая' },
  { value: 'qualification', label: 'Квалификация' },
  { value: 'proposal', label: 'Предложение' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'won', label: 'Успешно' },
  { value: 'lost', label: 'Закрыта' },
];

export const dealPriorityLabels: Record<DealPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export function pluralizeDeals(count: number): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'сделок';
  const mod10 = count % 10;
  if (mod10 === 1) return 'сделка';
  if (mod10 >= 2 && mod10 <= 4) return 'сделки';
  return 'сделок';
}

export function getDealStageLabel(stage: DealStage): string {
  return dealStageOptions.find((option) => option.value === stage)?.label ?? 'Новая';
}

export function formatDealAmount(amount: number): string {
  return formatCurrency(amount);
}

export function formatExpectedCloseDate(value: string | null): string {
  if (!value) return 'Срок не указан';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
