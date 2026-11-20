import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ContactRound, Plus, RefreshCw, UsersRound } from 'lucide-react';
import { ContactDetailsPanel } from '../components/contacts/ContactDetailsPanel';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ContactFilters, type ContactFilterValues } from '../components/contacts/ContactFilters';
import { ContactFormModal, type ContactFormValues } from '../components/contacts/ContactFormModal';
import { ContactsTable } from '../components/contacts/ContactsTable';
import { contactService } from '../services/contact-service';
import { services } from '../services/repositories';
import type { Contact, Employee } from '../types/domain';

type Feedback = { kind: 'success' | 'error'; message: string };

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="contacts-error-state" role="alert">
      <span className="contacts-error-state__icon"><AlertCircle size={20} /></span>
      <div><strong>Не удалось загрузить контакты</strong><p>{message}</p></div>
      <button className="secondary-button" type="button" onClick={onRetry}><RefreshCw size={15} />Повторить</button>
    </div>
  );
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContactFilterValues>({ query: '', type: 'all', status: 'all' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [detailsContact, setDetailsContact] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      const [loadedContacts, loadedEmployees] = await Promise.all([
        contactService.getAll(),
        services.employees.getAll(),
      ]);
      setContacts(loadedContacts);
      setEmployees(loadedEmployees);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Попробуйте загрузить список ещё раз.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadContacts(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadContacts]);
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const filteredContacts = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase('ru-RU');
    const digits = query.replace(/\D/g, '');
    return contacts.filter((contact) => {
      const matchesText = !query
        || `${contact.fullName} ${contact.company} ${contact.phone} ${contact.email}`.toLocaleLowerCase('ru-RU').includes(query)
        || (digits.length > 0 && contact.phone.replace(/\D/g, '').includes(digits));
      const matchesType = filters.type === 'all' || contact.type === filters.type;
      const matchesStatus = filters.status === 'all' || contact.status === filters.status;
      return matchesText && matchesType && matchesStatus;
    });
  }, [contacts, filters]);

  const openCreateForm = () => {
    setEditingContact(null);
    setFormOpen(true);
  };

  const openEditForm = (contact: Contact) => {
    setDetailsContact(null);
    setEditingContact(contact);
    setFormOpen(true);
  };

  const handleSave = async (values: ContactFormValues) => {
    setSaving(true);
    try {
      if (editingContact) {
        const updated = await contactService.update(editingContact.id, values);
        setContacts((current) => current.map((contact) => contact.id === updated.id ? updated : contact));
        setFeedback({ kind: 'success', message: 'Изменения контакта сохранены.' });
      } else {
        const created = await contactService.create(values);
        setContacts((current) => [created, ...current].sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
        setFeedback({ kind: 'success', message: 'Новый контакт добавлен.' });
      }
      setFormOpen(false);
      setEditingContact(null);
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Не удалось сохранить контакт.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletedId = deleteTarget.id;
    setDeleting(true);
    try {
      await contactService.delete(deletedId);
      setContacts((current) => current.filter((contact) => contact.id !== deletedId));
      setDetailsContact((current) => current?.id === deletedId ? null : current);
      setDeleteTarget(null);
      setFeedback({ kind: 'success', message: 'Контакт удалён.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Не удалось удалить контакт.' });
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => setFilters({ query: '', type: 'all', status: 'all' });
  const hasFilters = filters.query.length > 0 || filters.type !== 'all' || filters.status !== 'all';

  return (
    <main className="main-content contacts-page">
      <div className="contacts-page__heading">
        <div className="contacts-page__intro">
          <span className="eyebrow"><ContactRound size={14} aria-hidden="true" /> Клиентская база</span>
          <h2>Контакты</h2>
          <p>Храните данные клиентов и партнёров, фиксируйте договорённости и продолжайте общение с нужного места.</p>
        </div>
        <button className="primary-button contacts-add-button" type="button" onClick={openCreateForm} disabled={loading || Boolean(loadError)}>
          <Plus size={17} aria-hidden="true" />Добавить контакт
        </button>
      </div>

      {!loading && !loadError && (
        <div className="contacts-total-card">
          <span className="contacts-total-card__icon"><UsersRound size={19} aria-hidden="true" /></span>
          <div><span>Всего контактов</span><strong>{contacts.length.toLocaleString('ru-RU')}</strong></div>
          <small>В демонстрационной базе</small>
        </div>
      )}

      {loading ? (
        <div className="contacts-panel contacts-state-panel"><div className="loading-state" role="status"><span className="loading-spinner" />Загружаем контакты…</div></div>
      ) : loadError ? (
      <ErrorState message={loadError} onRetry={() => { setLoading(true); setLoadError(null); void loadContacts(); }} />
      ) : (
        <>
          <ContactFilters value={filters} onChange={setFilters} resultCount={filteredContacts.length} totalCount={contacts.length} />
          {contacts.length === 0 ? (
            <section className="contacts-panel contacts-empty-state">
              <span className="contacts-empty-state__icon"><ContactRound size={24} aria-hidden="true" /></span>
              <h3>Пока нет контактов</h3>
              <p>Добавьте первого клиента или партнёра — его карточка появится в этом списке.</p>
              <button className="primary-button" type="button" onClick={openCreateForm}><Plus size={16} />Добавить контакт</button>
            </section>
          ) : filteredContacts.length === 0 ? (
            <section className="contacts-panel contacts-empty-state">
              <span className="contacts-empty-state__icon"><ContactRound size={24} aria-hidden="true" /></span>
              <h3>Контакты не найдены</h3>
              <p>Измените запрос или сбросьте фильтры, чтобы увидеть другие карточки.</p>
              {hasFilters && <button className="secondary-button" type="button" onClick={clearFilters}>Сбросить поиск и фильтры</button>}
            </section>
          ) : (
            <section className="contacts-panel contacts-list-panel" aria-label="Список контактов">
              <ContactsTable
                contacts={filteredContacts}
                onView={setDetailsContact}
                onEdit={openEditForm}
                onDelete={setDeleteTarget}
              />
            </section>
          )}
        </>
      )}

      {formOpen && <ContactFormModal contact={editingContact} employees={employees} saving={saving} onClose={() => { if (!saving) setFormOpen(false); }} onSave={handleSave} />}
      {detailsContact && <ContactDetailsPanel contact={detailsContact} onClose={() => setDetailsContact(null)} onEdit={() => openEditForm(detailsContact)} onDelete={() => setDeleteTarget(detailsContact)} />}
      {deleteTarget && <ConfirmDialog name={deleteTarget.fullName} busy={deleting} onCancel={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={handleDelete} />}
      {feedback && (
        <div className={`contacts-toast contacts-toast--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
          {feedback.kind === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
          <span>{feedback.message}</span>
          <button type="button" aria-label="Закрыть уведомление" onClick={() => setFeedback(null)}>×</button>
        </div>
      )}
    </main>
  );
}
