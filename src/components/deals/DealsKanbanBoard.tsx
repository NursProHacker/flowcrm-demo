import { CirclePlus, Grip, Inbox } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import type { Contact, Deal, DealStage, Employee } from '../../types/domain';
import { dealStageOptions, formatDealAmount, pluralizeDeals } from '../../utils/deal-format';
import { DealCard } from './DealCard';

interface DealsKanbanBoardProps {
  deals: Deal[];
  contacts: Contact[];
  employees: Employee[];
  updatingDealId: string | null;
  onOpenDeal: (deal: Deal) => void;
  onMoveDeal: (dealId: string, stage: DealStage) => void;
}

export function DealsKanbanBoard({ deals, contacts, employees, updatingDealId, onOpenDeal, onMoveDeal }: DealsKanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<DealStage | null>(null);
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  const handleDragStart = (dealId: string, event: DragEvent<HTMLElement>) => {
    setDraggingId(dealId);
    event.dataTransfer.setData('text/plain', dealId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, stage: DealStage) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setHoveredStage(stage);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, stage: DealStage) => {
    event.preventDefault();
    const dealId = event.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setHoveredStage(null);
    if (dealId) onMoveDeal(dealId, stage);
  };

  return (
    <div className="deals-board-scroll" aria-label="Канбан-доска сделок">
      <div className="deals-board">
        {dealStageOptions.map(({ value: stage, label }) => {
          const stageDeals = deals.filter((deal) => deal.stageId === stage);
          const stageTotal = stageDeals.reduce((total, deal) => total + deal.amount, 0);
          return (
            <section
              key={stage}
              className={`deal-column deal-column--${stage}${hoveredStage === stage ? ' deal-column--drop-target' : ''}`}
              aria-label={`${label}: ${stageDeals.length} ${pluralizeDeals(stageDeals.length)}`}
              onDragOver={(event) => handleDragOver(event, stage)}
              onDragLeave={(event) => { if (event.currentTarget === event.target) setHoveredStage(null); }}
              onDrop={(event) => handleDrop(event, stage)}
            >
              <div className="deal-column__heading">
                <div className="deal-column__title">
                  <span className={`deal-stage-mark deal-stage-mark--${stage}`} />
                  <h3>{label}</h3>
                  <span className="deal-column__count">{stageDeals.length}</span>
                </div>
                <strong>{formatDealAmount(stageTotal)}</strong>
              </div>
              <div className="deal-column__cards">
                {stageDeals.length > 0 ? stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    contact={contactsById.get(deal.contactId)}
                    employee={employeesById.get(deal.assignedEmployeeId)}
                    isUpdating={updatingDealId === deal.id}
                    onOpen={onOpenDeal}
                    onDragStart={handleDragStart}
                    onDragEnd={() => { setDraggingId(null); setHoveredStage(null); }}
                  />
                )) : (
                  <div className="deal-column__empty">
                    {deals.length === 0 ? <Inbox size={18} aria-hidden="true" /> : <CirclePlus size={17} aria-hidden="true" />}
                    <span>{deals.length === 0 ? 'Сделок пока нет' : 'Нет сделок на этом этапе'}</span>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="deals-board__hint"><Grip size={14} aria-hidden="true" /> Перетащите карточку на другой этап. На телефоне этап можно изменить в карточке сделки.</p>
    </div>
  );
}
