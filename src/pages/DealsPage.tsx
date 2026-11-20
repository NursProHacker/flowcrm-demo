import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BriefcaseBusiness, CheckCircle2, Plus, RefreshCw, WalletCards } from 'lucide-react';
import { DealDetailsPanel } from '../components/deals/DealDetailsPanel';
import { DealFormModal, type DealFormValues } from '../components/deals/DealFormModal';
import { DealsFilters, type DealFilterValues } from '../components/deals/DealsFilters';
import { DealsKanbanBoard } from '../components/deals/DealsKanbanBoard';
import { contactService } from '../services/contact-service';
import { dealService } from '../services/deal-service';
import { services } from '../services/repositories';
import type { Activity, Contact, Deal, DealStage, Employee } from '../types/domain';
import { formatDealAmount, getDealStageLabel, pluralizeDeals } from '../utils/deal-format';

type Feedback = { kind: 'success' | 'error'; message: string };

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DealFilterValues>({ query: '', stage: 'all', employeeId: 'all' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [history, setHistory] = useState<Activity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingDealId, setUpdatingDealId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const historyRequest = useRef(0);

  const loadData = useCallback(async () => {
    try {
      const [loadedDeals, loadedContacts, loadedEmployees] = await Promise.all([
        dealService.getAll(),
        contactService.getAll(),
        services.employees.getAll(),
      ]);
      setDeals(loadedDeals);
      setContacts(loadedContacts);
      setEmployees(loadedEmployees);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Не удалось получить данные. Повторите попытку.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadData]);
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const loadHistory = useCallback(async (dealId: string) => {
    const requestId = ++historyRequest.current;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const loadedHistory = await dealService.getHistory(dealId);
      if (requestId === historyRequest.current) setHistory(loadedHistory);
    } catch (error) {
      if (requestId === historyRequest.current) {
        setHistoryError(error instanceof Error ? error.message : 'Не удалось загрузить историю сделки.');
      }
    } finally {
      if (requestId === historyRequest.current) setHistoryLoading(false);
    }
  }, []);

  const openDetails = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    void loadHistory(deal.id);
  }, [loadHistory]);

  const closeDetails = useCallback(() => {
    historyRequest.current += 1;
    setSelectedDeal(null);
    setHistoryLoading(false);
  }, []);

  const filteredDeals = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase('ru-RU');
    const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
    return deals.filter((deal) => {
      const contact = contactsById.get(deal.contactId);
      const matchesText = !query
        || `${deal.title} ${contact?.fullName ?? ''} ${contact?.company ?? ''} ${deal.amount}`.toLocaleLowerCase('ru-RU').includes(query);
      const matchesStage = filters.stage === 'all' || deal.stageId === filters.stage;
      const matchesEmployee = filters.employeeId === 'all' || deal.assignedEmployeeId === filters.employeeId;
      return matchesText && matchesStage && matchesEmployee;
    });
  }, [contacts, deals, filters]);

  const activeDealsValue = useMemo(
    () => deals.filter((deal) => deal.stageId !== 'won' && deal.stageId !== 'lost').reduce((total, deal) => total + deal.amount, 0),
    [deals],
  );

  const handleSave = async (values: DealFormValues) => {
    setSaving(true);
    try {
      if (editingDeal) {
        const updated = await dealService.update(editingDeal.id, values);
        setDeals((current) => current.map((deal) => deal.id === updated.id ? updated : deal));
        setFormOpen(false);
        setEditingDeal(null);
        setFeedback({ kind: 'success', message: 'Изменения сделки сохранены.' });
        openDetails(updated);
      } else {
        const created = await dealService.create(values);
        setDeals((current) => [created, ...current]);
        setFormOpen(false);
        setFeedback({ kind: 'success', message: 'Новая сделка добавлена.' });
        openDetails(created);
      }
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Не удалось сохранить сделку.' });
    } finally {
      setSaving(false);
    }
  };

  const handleMoveDeal = async (dealId: string, stageId: DealStage) => {
    const previous = deals.find((deal) => deal.id === dealId);
    if (!previous || previous.stageId === stageId || updatingDealId) return;
    const optimistic = { ...previous, stageId, updatedAt: new Date().toISOString() };
    setDeals((current) => current.map((deal) => deal.id === dealId ? optimistic : deal));
    setSelectedDeal((current) => current?.id === dealId ? optimistic : current);
    setUpdatingDealId(dealId);
    try {
      const updated = await dealService.changeStage(dealId, stageId);
      setDeals((current) => current.map((deal) => deal.id === dealId ? updated : deal));
      setSelectedDeal((current) => current?.id === dealId ? updated : current);
      setFeedback({ kind: 'success', message: `Сделка перемещена на этап «${getDealStageLabel(stageId)}».` });
      if (selectedDeal?.id === dealId) await loadHistory(dealId);
    } catch (error) {
      setDeals((current) => current.map((deal) => deal.id === dealId ? previous : deal));
      setSelectedDeal((current) => current?.id === dealId ? previous : current);
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Не удалось изменить этап сделки.' });
    } finally {
      setUpdatingDealId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeal) return;
    const deletedId = selectedDeal.id;
    setDeleting(true);
    try {
      await dealService.delete(deletedId);
      setDeals((current) => current.filter((deal) => deal.id !== deletedId));
      closeDetails();
      setFeedback({ kind: 'success', message: 'Сделка удалена.' });
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Не удалось удалить сделку.' });
    } finally {
      setDeleting(false);
    }
  };

  const openCreateForm = () => { setEditingDeal(null); setFormOpen(true); };
  const openEditForm = () => {
    if (!selectedDeal) return;
    setEditingDeal(selectedDeal);
    closeDetails();
    setFormOpen(true);
  };
  const hasFilters = filters.query.length > 0 || filters.stage !== 'all' || filters.employeeId !== 'all';

  return (
    <main className="main-content deals-page">
      <div className="deals-page__heading">
        <div className="deals-page__intro">
          <span className="eyebrow"><BriefcaseBusiness size={14} aria-hidden="true" /> Воронка продаж</span>
          <h2>Сделки</h2>
          <p>Следите за движением возможностей команды от первого контакта до успешного результата.</p>
        </div>
        <button className="primary-button deals-add-button" type="button" onClick={openCreateForm} disabled={loading || Boolean(loadError)}><Plus size={17} aria-hidden="true" />Добавить сделку</button>
      </div>

      {!loading && !loadError && (
        <div className="deals-summary">
          <div className="deals-summary__card">
            <span className="deals-summary__icon deals-summary__icon--blue"><BriefcaseBusiness size={18} aria-hidden="true" /></span>
            <div><span>Всего сделок</span><strong>{deals.length.toLocaleString('ru-RU')}</strong></div>
            <small>{pluralizeDeals(deals.length)} в воронке</small>
          </div>
          <div className="deals-summary__card">
            <span className="deals-summary__icon deals-summary__icon--green"><WalletCards size={18} aria-hidden="true" /></span>
            <div><span>Активный объём</span><strong>{formatDealAmount(activeDealsValue)}</strong></div>
            <small>Без успешных и закрытых</small>
          </div>
          <div className="deals-summary__demo">Демонстрационные данные</div>
        </div>
      )}

      {loading ? (
        <div className="contacts-panel contacts-state-panel"><div className="loading-state" role="status"><span className="loading-spinner" />Загружаем сделки…</div></div>
      ) : loadError ? (
        <div className="contacts-error-state" role="alert">
          <span className="contacts-error-state__icon"><AlertCircle size={20} /></span>
          <div><strong>Не удалось загрузить сделки</strong><p>{loadError}</p></div>
          <button className="secondary-button" type="button" onClick={() => { setLoading(true); void loadData(); }}><RefreshCw size={15} />Повторить</button>
        </div>
      ) : (
        <>
          <DealsFilters value={filters} employees={employees} resultCount={filteredDeals.length} totalCount={deals.length} onChange={setFilters} />
          {filteredDeals.length === 0 ? (
            <section className="contacts-panel deals-empty-state">
              <span className="contacts-empty-state__icon"><BriefcaseBusiness size={24} aria-hidden="true" /></span>
              <h3>{deals.length === 0 ? 'Пока нет сделок' : 'Сделки не найдены'}</h3>
              <p>{deals.length === 0 ? 'Добавьте первую возможность — она появится на канбан-доске.' : 'Измените запрос или сбросьте фильтры, чтобы увидеть другие сделки.'}</p>
              {deals.length === 0 ? (
                <button className="primary-button" type="button" onClick={openCreateForm}><Plus size={16} />Добавить сделку</button>
              ) : hasFilters ? (
                <button className="secondary-button" type="button" onClick={() => setFilters({ query: '', stage: 'all', employeeId: 'all' })}>Сбросить поиск и фильтры</button>
              ) : null}
            </section>
          ) : (
            <DealsKanbanBoard deals={filteredDeals} contacts={contacts} employees={employees} updatingDealId={updatingDealId} onOpenDeal={openDetails} onMoveDeal={(dealId, stage) => void handleMoveDeal(dealId, stage)} />
          )}
        </>
      )}

      {formOpen && <DealFormModal deal={editingDeal} contacts={contacts} employees={employees} saving={saving} onClose={() => { if (!saving) setFormOpen(false); }} onSave={handleSave} />}
      {selectedDeal && (
        <DealDetailsPanel
          deal={selectedDeal}
          contact={contacts.find((contact) => contact.id === selectedDeal.contactId)}
          employee={employees.find((employee) => employee.id === selectedDeal.assignedEmployeeId)}
          employees={employees}
          history={history}
          historyLoading={historyLoading}
          historyError={historyError}
          updatingStage={updatingDealId === selectedDeal.id}
          deleting={deleting}
          onClose={closeDetails}
          onEdit={openEditForm}
          onStageChange={(stage) => void handleMoveDeal(selectedDeal.id, stage)}
          onDelete={handleDelete}
        />
      )}
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
