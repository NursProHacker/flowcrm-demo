import { useEffect } from 'react';
import { Building2, CalendarDays, Mail, Phone, Trash2, UserRound, X } from 'lucide-react';
import type { Contact } from '../../types/domain';
import { contactDateFormat, contactStatusLabels, contactTypeLabels } from '../../utils/contact-format';

interface ContactDetailsPanelProps {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactDetailsPanel({ contact, onClose, onEdit, onDelete }: ContactDetailsPanelProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="contacts-overlay contacts-overlay--details" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="contact-details" role="dialog" aria-modal="true" aria-labelledby="contact-details-title">
        <div className="contact-details__topline">
          <span className="eyebrow">Карточка контакта</span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть карточку"><X size={19} /></button>
        </div>
        <div className="contact-details__identity">
          <span className="contact-avatar contact-avatar--large" aria-hidden="true">{contact.fullName.slice(0, 1).toLocaleUpperCase('ru-RU')}</span>
          <div>
            <h2 id="contact-details-title">{contact.fullName}</h2>
            <p>{contact.company || 'Компания не указана'}</p>
          </div>
        </div>

        <div className="contact-details__badges">
          <span className={`contact-type contact-type--${contact.type}`}>{contactTypeLabels[contact.type]}</span>
          <span className={`contact-status contact-status--${contact.status}`}><i />{contactStatusLabels[contact.status]}</span>
        </div>

        <div className="contact-details__section">
          <h3>Контактная информация</h3>
          <a href={`tel:${contact.phone}`} className="contact-detail-line"><span className="contact-detail-line__icon"><Phone size={16} /></span><span><small>Телефон</small><strong>{contact.phone}</strong></span></a>
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="contact-detail-line"><span className="contact-detail-line__icon"><Mail size={16} /></span><span><small>Электронная почта</small><strong>{contact.email}</strong></span></a>
          ) : (
            <div className="contact-detail-line"><span className="contact-detail-line__icon"><Mail size={16} /></span><span><small>Электронная почта</small><strong>Не указана</strong></span></div>
          )}
          <div className="contact-detail-line"><span className="contact-detail-line__icon"><Building2 size={16} /></span><span><small>Компания</small><strong>{contact.company || 'Не указана'}</strong></span></div>
          <div className="contact-detail-line"><span className="contact-detail-line__icon"><UserRound size={16} /></span><span><small>Тип контакта</small><strong>{contactTypeLabels[contact.type]}</strong></span></div>
          <div className="contact-detail-line"><span className="contact-detail-line__icon"><CalendarDays size={16} /></span><span><small>Добавлен</small><strong>{contactDateFormat.format(new Date(contact.createdAt))}</strong></span></div>
        </div>

        <div className="contact-details__section contact-details__notes">
          <h3>Заметки</h3>
          <p>{contact.notes || 'Заметок пока нет.'}</p>
        </div>

        <div className="contact-details__actions">
          <button className="danger-quiet-button" type="button" onClick={onDelete}><Trash2 size={16} />Удалить</button>
          <button className="primary-button" type="button" onClick={onEdit}>Редактировать</button>
        </div>
      </section>
    </div>
  );
}

