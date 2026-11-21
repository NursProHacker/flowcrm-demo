import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Contact, Deal, DealPriority, DealStage, Employee } from '../../types/domain';
import { dealPriorityLabels, dealStageOptions } from '../../utils/deal-format';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../../utils/currency';
import { useAppSettings } from '../../contexts/useAppSettings';

export type DealFormValues = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>;

interface DealFormModalProps {
  deal: Deal | null;
  contacts: Contact[];
  employees: Employee[];
  saving: boolean;
  onClose: () => void;
  onSave: (values: DealFormValues) => Promise<void>;
}

type DealFormErrors = Partial<Record<'title' | 'contactId' | 'amount' | 'assignedEmployeeId', string>>;

export function DealFormModal({ deal, contacts, employees, saving, onClose, onSave }: DealFormModalProps) {
  const { settings } = useAppSettings();
  const [title, setTitle] = useState(deal?.title ?? '');
  const [contactId, setContactId] = useState(deal?.contactId ?? contacts[0]?.id ?? '');
  const [amount, setAmount] = useState(deal ? String(deal.amount) : '');
  const [stageId, setStageId] = useState<DealStage>(deal?.stageId ?? 'new');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(deal?.assignedEmployeeId ?? employees[0]?.id ?? '');
  const [priority, setPriority] = useState<DealPriority>(deal?.priority ?? 'medium');
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal?.expectedCloseDate ?? '');
  const [notes, setNotes] = useState(deal?.notes ?? '');
  const [errors, setErrors] = useState<DealFormErrors>({});
  const selectedContact = contacts.find((contact) => contact.id === contactId);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, saving]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: DealFormErrors = {};
    if (!title.trim()) nextErrors.title = 'Укажите название сделки.';
    if (!contactId || !selectedContact) nextErrors.contactId = 'Выберите контакт из списка.';
    const numericAmount = Number(amount.replace(',', '.'));
    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = 'Сумма должна быть больше нуля.';
    }
    if (!assignedEmployeeId || !employees.some((employee) => employee.id === assignedEmployeeId)) {
      nextErrors.assignedEmployeeId = 'Выберите ответственного сотрудника.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || saving) return;

    await onSave({
      title: title.trim(),
      contactId,
      amount: numericAmount,
      currency: DEFAULT_CURRENCY,
      stageId,
      priority,
      expectedCloseDate: expectedCloseDate || null,
      assignedEmployeeId,
      source: deal?.source ?? 'other',
      notes: notes.trim(),
    });
  };

  return (
    <div className="contacts-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="contacts-dialog deal-form-dialog" role="dialog" aria-modal="true" aria-labelledby="deal-form-title">
        <div className="contacts-dialog__header">
          <div>
            <span className="eyebrow">Воронка продаж</span>
            <h2 id="deal-form-title">{deal ? 'Редактировать сделку' : 'Новая сделка'}</h2>
            <p>Свяжите сделку с контактом и укажите ключевые параметры работы.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={saving} aria-label="Закрыть окно"><X size={19} /></button>
        </div>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {contacts.length === 0 && <div className="deal-form-notice" role="status">Для создания сделки сначала добавьте контакт в клиентскую базу.</div>}
          <div className="contact-form__grid">
            <label className="contact-field contact-field--wide">
              <span>Название сделки <i>*</i></span>
              <input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: undefined })); }} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'deal-title-error' : undefined} placeholder="Например, Внедрение CRM" />
              {errors.title && <small id="deal-title-error" className="contact-field__error">{errors.title}</small>}
            </label>
            <label className="contact-field contact-field--wide">
              <span>Контакт <i>*</i></span>
              <select value={contactId} onChange={(event) => { setContactId(event.target.value); setErrors((current) => ({ ...current, contactId: undefined })); }} aria-invalid={Boolean(errors.contactId)} aria-describedby={errors.contactId ? 'deal-contact-error' : undefined}>
                <option value="">Выберите контакт</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}{contact.company ? ` — ${contact.company}` : ''}</option>)}
              </select>
              {errors.contactId && <small id="deal-contact-error" className="contact-field__error">{errors.contactId}</small>}
            </label>
            <label className="contact-field contact-field--wide">
              <span>Компания</span>
              <input value={selectedContact?.company ?? ''} readOnly placeholder="У выбранного контакта нет компании" />
              <small className="deal-field-hint">Компания связана с карточкой выбранного контакта.</small>
            </label>
            <label className="contact-field">
              <span>Сумма, {getCurrencySymbol(settings.currency)} <i>*</i></span>
              <input type="number" min="1" step="1" value={amount} onChange={(event) => { setAmount(event.target.value); setErrors((current) => ({ ...current, amount: undefined })); }} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'deal-amount-error' : undefined} placeholder="0" />
              <small className="deal-field-hint">Сумма вводится числом, без символа валюты. Отображение: {settings.currency}.</small>
              {errors.amount && <small id="deal-amount-error" className="contact-field__error">{errors.amount}</small>}
            </label>
            <label className="contact-field">
              <span>Этап сделки</span>
              <select value={stageId} onChange={(event) => setStageId(event.target.value as DealStage)}>
                {dealStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="contact-field">
              <span>Ответственный <i>*</i></span>
              <select value={assignedEmployeeId} onChange={(event) => { setAssignedEmployeeId(event.target.value); setErrors((current) => ({ ...current, assignedEmployeeId: undefined })); }} aria-invalid={Boolean(errors.assignedEmployeeId)} aria-describedby={errors.assignedEmployeeId ? 'deal-owner-error' : undefined}>
                <option value="">Выберите сотрудника</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
              </select>
              {errors.assignedEmployeeId && <small id="deal-owner-error" className="contact-field__error">{errors.assignedEmployeeId}</small>}
            </label>
            <label className="contact-field">
              <span>Приоритет</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as DealPriority)}>
                {(Object.entries(dealPriorityLabels) as Array<[DealPriority, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="contact-field contact-field--wide">
              <span>Плановая дата закрытия</span>
              <input type="date" value={expectedCloseDate} onChange={(event) => setExpectedCloseDate(event.target.value)} />
            </label>
            <label className="contact-field contact-field--wide">
              <span>Описание и заметки</span>
              <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Договорённости и следующие шаги" />
            </label>
          </div>

          <div className="contact-form__footer">
            <span className="contact-form__required"><i>*</i> Обязательные поля</span>
            <div>
              <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Отмена</button>
              <button className="primary-button" type="submit" disabled={saving || contacts.length === 0}>
                {saving ? 'Сохраняем…' : deal ? 'Сохранить изменения' : 'Добавить сделку'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
