import { CalendarDays, UserRound } from 'lucide-react';
import type { DragEvent } from 'react';
import type { Contact, Deal, Employee } from '../../types/domain';
import { dealPriorityLabels, formatDealAmount, formatExpectedCloseDate } from '../../utils/deal-format';

interface DealCardProps {
  deal: Deal;
  contact: Contact | undefined;
  employee: Employee | undefined;
  isUpdating: boolean;
  onOpen: (deal: Deal) => void;
  onDragStart: (dealId: string, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function DealCard({ deal, contact, employee, isUpdating, onOpen, onDragStart, onDragEnd }: DealCardProps) {
  return (
    <article className={`deal-card${isUpdating ? ' deal-card--updating' : ''}`} draggable={!isUpdating} onDragStart={(event) => onDragStart(deal.id, event)} onDragEnd={onDragEnd}>
      <button className="deal-card__open" type="button" onClick={() => onOpen(deal)} aria-label={`Открыть сделку ${deal.title}`}>
        <span className="deal-card__title-row">
          <strong>{deal.title}</strong>
          <span className={`deal-priority-badge deal-priority-badge--${deal.priority}`} title={`Приоритет: ${dealPriorityLabels[deal.priority]}`}><i />{dealPriorityLabels[deal.priority]}</span>
        </span>
        <span className="deal-card__contact">{contact?.fullName ?? 'Контакт не найден'}</span>
        <span className="deal-card__company">{contact?.company || 'Компания не указана'}</span>
        <span className="deal-card__amount">{formatDealAmount(deal.amount)}</span>
        <span className="deal-card__meta">
          <span><UserRound size={13} aria-hidden="true" />{employee?.fullName ?? 'Не назначен'}</span>
          <span><CalendarDays size={13} aria-hidden="true" />{formatExpectedCloseDate(deal.expectedCloseDate)}</span>
        </span>
      </button>
    </article>
  );
}
