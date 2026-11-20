import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleAlert, Clock3, Mail, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react';
import type { Activity, Contact, Deal, DealStage, Employee } from '../../types/domain';
import { dealPriorityLabels, dealStageOptions, formatDealAmount, formatExpectedCloseDate } from '../../utils/deal-format';

interface DealDetailsPanelProps {
  deal: Deal;
  contact: Contact | undefined;
  employee: Employee | undefined;
  employees: Employee[];
  history: Activity[];
  historyLoading: boolean;
  historyError: string | null;
  updatingStage: boolean;
  deleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStageChange: (stage: DealStage) => void;
  onDelete: () => Promise<void>;
}

const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function ActivityIcon({ type }: { type: Activity['type'] }) {
  if (type === 'created') return <Plus size={14} aria-hidden="true" />;
  if (type === 'status_changed') return <ArrowUpRight size={14} aria-hidden="true" />;
  return <Pencil size={14} aria-hidden="true" />;
}

export function DealDetailsPanel({ deal, contact, employee, employees, history, historyLoading, historyError, updatingStage, deleting, onClose, onEdit, onStageChange, onDelete }: DealDetailsPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const employeesById = new Map(employees.map((item) => [item.id, item]));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [confirmDelete, deleting, onClose]);

  return (
    <div className="contacts-overlay contacts-overlay--details" onMouseDown={(event) => { if (event.target === event.currentTarget && !confirmDelete) onClose(); }}>
      <section className="contact-details deal-details" role="dialog" aria-modal="true" aria-labelledby="deal-details-title">
        <div className="contact-details__topline">
          <span className="eyebrow">Карточка сделки</span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть карточку"><X size={19} /></button>
        </div>

        <div className="deal-details__identity">
          <span className="deal-details__icon" aria-hidden="true"><ArrowUpRight size={21} /></span>
          <div>
            <h2 id="deal-details-title">{deal.title}</h2>
            <p>{formatDealAmount(deal.amount)}</p>
          </div>
        </div>

        <div className="deal-details__stage-control">
          <label htmlFor="deal-stage-select">Этап сделки</label>
          <select id="deal-stage-select" value={deal.stageId} disabled={updatingStage} onChange={(event) => onStageChange(event.target.value as DealStage)}>
            {dealStageOptions.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
          </select>
        </div>

        <div className="deal-details__facts">
          <div><small>Приоритет</small><span className={`deal-priority-label deal-priority-label--${deal.priority}`}><i />{dealPriorityLabels[deal.priority]}</span></div>
          <div><small>Плановое закрытие</small><strong>{formatExpectedCloseDate(deal.expectedCloseDate)}</strong></div>
          <div><small>Ответственный</small><strong><UserRound size={14} aria-hidden="true" />{employee?.fullName ?? 'Не назначен'}</strong></div>
          <div><small>Создана</small><strong><CalendarDays size={14} aria-hidden="true" />{dateFormat.format(new Date(deal.createdAt))}</strong></div>
          <div><small>Обновлена</small><strong><Clock3 size={14} aria-hidden="true" />{dateTimeFormat.format(new Date(deal.updatedAt))}</strong></div>
        </div>

        <div className="deal-details__section">
          <h3>Контакт</h3>
          {contact ? (
            <div className="deal-contact-card">
              <span className="contact-avatar" aria-hidden="true">{contact.fullName.slice(0, 1).toLocaleUpperCase('ru-RU')}</span>
              <div className="deal-contact-card__copy">
                <strong>{contact.fullName}</strong>
                <span>{contact.company || 'Компания не указана'}</span>
              </div>
              <div className="deal-contact-card__actions">
                {contact.phone && <a href={`tel:${contact.phone}`} aria-label={`Позвонить ${contact.fullName}`}><ArrowDownRight size={15} /></a>}
                {contact.email && <a href={`mailto:${contact.email}`} aria-label={`Написать ${contact.fullName}`}><Mail size={15} /></a>}
              </div>
            </div>
          ) : <p className="deal-details__muted"><CircleAlert size={15} />Связанный контакт больше не найден.</p>}
        </div>

        <div className="deal-details__section deal-details__notes">
          <h3>Описание и заметки</h3>
          <p>{deal.notes || 'Описание пока не добавлено.'}</p>
        </div>

        <div className="deal-details__section deal-history">
          <div className="deal-history__heading"><h3>История сделки</h3><span>{history.length}</span></div>
          {historyLoading ? <p className="deal-history__muted">Загружаем историю…</p> : historyError ? (
            <p className="deal-details__muted"><CircleAlert size={15} />{historyError}</p>
          ) : history.length === 0 ? (
            <p className="deal-history__muted">История появится после первого изменения сделки.</p>
          ) : (
            <ol className="deal-history__list">
              {history.map((activity) => (
                <li key={activity.id} className="deal-history__item">
                  <span className={`deal-history__icon deal-history__icon--${activity.type}`}><ActivityIcon type={activity.type} /></span>
                  <div><strong>{activity.description}</strong><small>{employeesById.get(activity.employeeId)?.fullName ?? 'Команда'} · {dateTimeFormat.format(new Date(activity.createdAt))}</small></div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="contact-details__actions">
          <button className="danger-quiet-button" type="button" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />Удалить</button>
          <button className="primary-button" type="button" onClick={onEdit}><Pencil size={15} />Редактировать</button>
        </div>

        {confirmDelete && (
          <div className="contacts-overlay contacts-overlay--confirm" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setConfirmDelete(false); }}>
            <section className="contacts-confirm" role="alertdialog" aria-modal="true" aria-labelledby="deal-delete-title" aria-describedby="deal-delete-description">
              <span className="contacts-confirm__icon"><Trash2 size={20} /></span>
              <h2 id="deal-delete-title">Удалить сделку?</h2>
              <p id="deal-delete-description">Сделка «{deal.title}» будет удалена из списка. Это действие нельзя отменить.</p>
              <div className="contacts-confirm__actions">
                <button className="secondary-button" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Оставить</button>
                <button className="danger-button" type="button" onClick={() => void onDelete()} disabled={deleting}>{deleting ? 'Удаляем…' : 'Удалить сделку'}</button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
