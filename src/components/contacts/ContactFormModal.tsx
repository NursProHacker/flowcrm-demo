import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Contact, ContactStatus, ContactType, Employee } from '../../types/domain';

export type ContactFormValues = Omit<Contact, 'id' | 'createdAt'>;

interface ContactFormModalProps {
  contact: Contact | null;
  employees: Employee[];
  saving: boolean;
  onClose: () => void;
  onSave: (values: ContactFormValues) => Promise<void>;
}

type ContactFieldErrors = Partial<Record<'fullName' | 'phone' | 'email', string>>;

const typeOptions: Array<{ value: ContactType; label: string }> = [
  { value: 'lead', label: 'Потенциальный клиент' },
  { value: 'customer', label: 'Клиент' },
  { value: 'partner', label: 'Партнёр' },
];

const statusOptions: Array<{ value: ContactStatus; label: string }> = [
  { value: 'active', label: 'Активный' },
  { value: 'inactive', label: 'Неактивный' },
];

export function ContactFormModal({ contact, employees, saving, onClose, onSave }: ContactFormModalProps) {
  const [values, setValues] = useState<ContactFormValues>(() => ({
    fullName: contact?.fullName ?? '',
    company: contact?.company ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    type: contact?.type ?? 'customer',
    status: contact?.status ?? 'active',
    source: contact?.source ?? 'other',
    assignedEmployeeId: contact?.assignedEmployeeId ?? employees[0]?.id ?? '',
    notes: contact?.notes ?? '',
  }));
  const [errors, setErrors] = useState<ContactFieldErrors>({});

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, saving]);

  const updateField = <Field extends keyof ContactFormValues>(field: Field, value: ContactFormValues[Field]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === 'fullName' || field === 'phone' || field === 'email') {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ContactFieldErrors = {};
    if (!values.fullName.trim()) nextErrors.fullName = 'Укажите имя контакта.';
    if (!values.phone.trim()) nextErrors.phone = 'Укажите номер телефона.';
    const email = values.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      nextErrors.email = 'Проверьте формат электронной почты.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || saving) return;

    await onSave({
      ...values,
      fullName: values.fullName.trim(),
      company: values.company.trim(),
      phone: values.phone.trim(),
      email,
      notes: values.notes.trim(),
    });
  };

  return (
    <div
      className="contacts-overlay"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}
    >
      <section className="contacts-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-form-title">
        <div className="contacts-dialog__header">
          <div>
            <span className="eyebrow">Карточка контакта</span>
            <h2 id="contact-form-title">{contact ? 'Редактировать контакт' : 'Новый контакт'}</h2>
            <p>Добавьте основную информацию, чтобы команда могла продолжить общение.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} disabled={saving} aria-label="Закрыть окно">
            <X size={19} />
          </button>
        </div>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-form__grid">
            <label className="contact-field contact-field--wide">
              <span>Имя и фамилия <i>*</i></span>
              <input autoFocus value={values.fullName} onChange={(event) => updateField('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'contact-name-error' : undefined} placeholder="Например, Анна Смирнова" />
              {errors.fullName && <small id="contact-name-error" className="contact-field__error">{errors.fullName}</small>}
            </label>

            <label className="contact-field">
              <span>Компания</span>
              <input value={values.company} onChange={(event) => updateField('company', event.target.value)} placeholder="Название компании" />
            </label>
            <label className="contact-field">
              <span>Телефон <i>*</i></span>
              <input type="tel" value={values.phone} onChange={(event) => updateField('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'contact-phone-error' : undefined} placeholder="+7 000 000-00-00" />
              {errors.phone && <small id="contact-phone-error" className="contact-field__error">{errors.phone}</small>}
            </label>
            <label className="contact-field contact-field--wide">
              <span>Электронная почта</span>
              <input type="email" value={values.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined} placeholder="name@example.test" />
              {errors.email && <small id="contact-email-error" className="contact-field__error">{errors.email}</small>}
            </label>
            <label className="contact-field">
              <span>Тип контакта</span>
              <select value={values.type} onChange={(event) => updateField('type', event.target.value as ContactType)}>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="contact-field">
              <span>Статус</span>
              <select value={values.status} onChange={(event) => updateField('status', event.target.value as ContactStatus)}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {employees.length > 0 && (
              <label className="contact-field contact-field--wide">
                <span>Ответственный</span>
                <select value={values.assignedEmployeeId} onChange={(event) => updateField('assignedEmployeeId', event.target.value)}>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
                </select>
              </label>
            )}
            <label className="contact-field contact-field--wide">
              <span>Заметки</span>
              <textarea rows={3} value={values.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Важные детали общения и договорённости" />
            </label>
          </div>

          <div className="contact-form__footer">
            <span className="contact-form__required"><i>*</i> Обязательные поля</span>
            <div>
              <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Отмена</button>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Сохраняем…' : contact ? 'Сохранить изменения' : 'Добавить контакт'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
