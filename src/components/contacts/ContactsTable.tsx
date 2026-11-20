import { Eye, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import type { Contact } from '../../types/domain';
import { contactDateFormat, contactStatusLabels, contactTypeLabels } from '../../utils/contact-format';

interface ContactsTableProps {
  contacts: Contact[];
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactsTable({ contacts, onView, onEdit, onDelete }: ContactsTableProps) {
  return (
    <div className="contacts-table-scroll">
      <table className="contacts-table">
        <thead>
          <tr>
            <th scope="col">Имя</th>
            <th scope="col">Компания</th>
            <th scope="col">Телефон</th>
            <th scope="col">Электронная почта</th>
            <th scope="col">Тип</th>
            <th scope="col">Статус</th>
            <th scope="col">Добавлен</th>
            <th scope="col"><span className="sr-only">Действия</span></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td data-label="Имя">
                <button className="contact-name-button" type="button" onClick={() => onView(contact)}>
                  <span className="contact-avatar" aria-hidden="true">{contact.fullName.slice(0, 1).toLocaleUpperCase('ru-RU')}</span>
                  <span>{contact.fullName}</span>
                </button>
              </td>
              <td data-label="Компания"><span className="contact-table-company">{contact.company || '—'}</span></td>
              <td data-label="Телефон"><a className="contact-table-link" href={`tel:${contact.phone}`}><Phone size={14} aria-hidden="true" />{contact.phone}</a></td>
              <td data-label="Электронная почта">
                {contact.email ? <a className="contact-table-link" href={`mailto:${contact.email}`}><Mail size={14} aria-hidden="true" />{contact.email}</a> : <span className="contact-table-muted">—</span>}
              </td>
              <td data-label="Тип"><span className={`contact-type contact-type--${contact.type}`}>{contactTypeLabels[contact.type]}</span></td>
              <td data-label="Статус"><span className={`contact-status contact-status--${contact.status}`}><i />{contactStatusLabels[contact.status]}</span></td>
              <td data-label="Добавлен"><span className="contact-table-date">{contactDateFormat.format(new Date(contact.createdAt))}</span></td>
              <td data-label="Действия">
                <div className="contact-row-actions">
                  <button type="button" className="contact-action" aria-label={`Открыть контакт ${contact.fullName}`} title="Открыть" onClick={() => onView(contact)}><Eye size={16} /></button>
                  <button type="button" className="contact-action" aria-label={`Редактировать контакт ${contact.fullName}`} title="Редактировать" onClick={() => onEdit(contact)}><Pencil size={15} /></button>
                  <button type="button" className="contact-action contact-action--danger" aria-label={`Удалить контакт ${contact.fullName}`} title="Удалить" onClick={() => onDelete(contact)}><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
