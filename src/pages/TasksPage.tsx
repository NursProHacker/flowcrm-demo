import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import { AlertCircle, CalendarClock, Check, CircleAlert, Clock3, LayoutGrid, List, Plus, Search, Trash2, X } from 'lucide-react';
import { services } from '../services/repositories';
import { createTask, isTaskOverdue, taskPriorityLabels, taskStatusLabels, taskStatuses, updateTask, type TaskInput } from '../services/task-service';
import type { Contact, Deal, Employee, Task, TaskPriority, TaskStatus } from '../types/domain';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatCard } from '../components/ui/StatCard';
import { formatRegionDate } from '../utils/region-format';

type View = 'list' | 'kanban';
const dateLabel = (value: string) => formatRegionDate(value, { month: 'short', time: true });
const dateInput = (value?: string) => { const date = value ? new Date(value) : new Date(Date.now() + 86400000); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };

export function TasksPage() {
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [view, setView] = useState<View>('list');
  const [formTask, setFormTask] = useState<Task | null | undefined>(undefined);
  const [detail, setDetail] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [t, c, d, e] = await Promise.all([services.tasks.getAll(), services.contacts.getAll(), services.deals.getAll(), services.employees.getAll()]);
      setTasks(t); setContacts(c); setDeals(d); setEmployees(e);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось загрузить задачи.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const initialLoad = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(initialLoad); }, [load]);
  useEffect(() => { const taskId = (location.state as { taskId?: string } | null)?.taskId; const match = taskId ? tasks.find((task) => task.id === taskId) : undefined; if (!match || detail) return; const timer = window.setTimeout(() => setDetail(match), 0); return () => window.clearTimeout(timer); }, [location.state, tasks, detail]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => window.clearTimeout(timer); }, [toast]);

  const filtered = useMemo(() => tasks.filter((task) => {
    const employee = employees.find((item) => item.id === task.assignedEmployeeId)?.fullName ?? '';
    const contact = contacts.find((item) => item.id === task.relatedContactId)?.fullName ?? '';
    const deal = deals.find((item) => item.id === task.relatedDealId)?.title ?? '';
    const haystack = `${task.title} ${task.description} ${employee} ${contact} ${deal}`.toLocaleLowerCase('ru-RU');
    return (!query || haystack.includes(query.toLocaleLowerCase('ru-RU')))
      && (status === 'all' || (status === 'overdue' ? isTaskOverdue(task) : task.status === status))
      && (priority === 'all' || task.priority === priority)
      && (assignee === 'all' || task.assignedEmployeeId === assignee);
  }).sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate)), [tasks, query, status, priority, assignee, employees, contacts, deals]);

  const save = async (values: TaskInput) => {
    setSaving(true);
    try {
      const saved = formTask ? await updateTask(formTask.id, values) : await createTask(values);
      setTasks((current) => formTask ? current.map((task) => task.id === saved.id ? saved : task) : [...current, saved]);
      setFormTask(undefined); setToast(formTask ? 'Изменения задачи сохранены.' : 'Задача создана.');
    } catch (reason) { setToast(reason instanceof Error ? reason.message : 'Не удалось сохранить задачу.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await services.tasks.delete(deleteTarget.id); setTasks((current) => current.filter((item) => item.id !== deleteTarget.id)); setDetail(null); setDeleteTarget(null); setToast('Задача удалена.'); }
    catch { setToast('Не удалось удалить задачу.'); }
    finally { setDeleting(false); }
  };
  const move = async (task: Task, next: TaskStatus) => {
    if (task.status === next) return;
    try {
      const changed = await updateTask(task.id, { title: task.title, description: task.description, dueDate: task.dueDate, priority: task.priority, status: next, assignedEmployeeId: task.assignedEmployeeId, relatedContactId: task.relatedContactId, relatedDealId: task.relatedDealId });
      setTasks((current) => current.map((item) => item.id === task.id ? changed : item)); setDetail(changed); setToast('Статус задачи обновлён.');
    } catch { setToast('Не удалось изменить статус.'); }
  };

  const counts = { all: tasks.length, pending: tasks.filter((task) => task.status === 'pending').length, completed: tasks.filter((task) => task.status === 'completed').length, overdue: tasks.filter((task) => isTaskOverdue(task)).length };
  const names = (task: Task) => ({ employee: employees.find((item) => item.id === task.assignedEmployeeId)?.fullName ?? 'Не назначен', contact: contacts.find((item) => item.id === task.relatedContactId)?.fullName, deal: deals.find((item) => item.id === task.relatedDealId)?.title });

  return <main className="main-content tasks-page">
    <div className="page-intro"><div><p className="eyebrow"><Check size={14}/> Рабочее пространство</p><h2>Задачи</h2><p className="page-intro__description">Планируйте работу команды и следите за сроками.</p></div><button className="primary-button" onClick={() => setFormTask(null)}><Plus size={16}/>Создать задачу</button></div>
    <section className="stats-grid task-stats" aria-label="Сводка задач">
      <StatCard label="Всего задач" value={String(counts.all)} note="В рабочем списке" icon={List} />
      <StatCard label="Ожидают" value={String(counts.pending)} note="Нужны к выполнению" icon={Clock3} iconTone="amber" />
      <StatCard label="Выполнены" value={String(counts.completed)} note="Завершённые задачи" icon={Check} iconTone="green" />
      <StatCard label="Просрочены" value={String(counts.overdue)} note="Срок уже прошёл" icon={CircleAlert} iconTone="violet" />
    </section>
    <section className="tasks-toolbar"><div className="tasks-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по задачам" aria-label="Поиск по задачам"/></div><select aria-label="Фильтр по статусу" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Все статусы</option><option value="pending">Ожидает</option><option value="in_progress">В работе</option><option value="completed">Выполнена</option><option value="overdue">Просрочена</option></select><select aria-label="Фильтр по приоритету" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Все приоритеты</option>{Object.entries(taskPriorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="Фильтр по сотруднику" value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="all">Все сотрудники</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select><div className="tasks-view-switch" aria-label="Режим отображения"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="Список"><List size={17}/></button><button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')} aria-label="Канбан"><LayoutGrid size={17}/></button></div></section>
    {error ? <div className="contacts-error-state" role="alert"><AlertCircle/>{error}<button className="secondary-button" onClick={() => void load()}>Повторить</button></div> : loading ? <div className="loading-state"><span className="loading-spinner"/>Загружаем задачи…</div> : view === 'list' ? <section className="tasks-table-wrap"><table className="deals-table tasks-table"><thead><tr><th>Задача</th><th>Статус</th><th>Приоритет</th><th>Ответственный</th><th>Срок</th><th>Связь</th><th>Действия</th></tr></thead><tbody>{filtered.map((task) => <tr key={task.id} onClick={() => setDetail(task)}><td><strong>{task.title}</strong>{task.description && <small>{task.description}</small>}</td><td><select value={task.status === 'cancelled' ? 'pending' : task.status} onClick={(event) => event.stopPropagation()} onChange={(event) => void move(task, event.target.value as TaskStatus)} aria-label={`Статус задачи ${task.title}`}>{taskStatuses.map((item) => <option key={item} value={item}>{taskStatusLabels[item]}</option>)}</select>{isTaskOverdue(task) && <span className="task-overdue">Просрочена</span>}</td><td><span className={`priority priority--${task.priority}`}><i/>{taskPriorityLabels[task.priority]}</span></td><td>{names(task).employee}</td><td>{dateLabel(task.dueDate)}</td><td>{names(task).contact ?? names(task).deal ?? '—'}</td><td><button className="icon-button" aria-label="Удалить задачу" onClick={(event) => { event.stopPropagation(); setDeleteTarget(task); }}><Trash2 size={16}/></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><strong>{tasks.length ? 'Задачи не найдены' : 'Пока нет задач'}</strong><span>Измените фильтры или создайте задачу.</span></div>}</section> : <div className="task-board">{taskStatuses.map((column) => <section className="task-column" key={column} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const item = tasks.find((task) => task.id === event.dataTransfer.getData('text/plain')); if (item) void move(item, column); }}><header><strong>{taskStatusLabels[column]}</strong><span>{filtered.filter((task) => task.status === column).length}</span></header>{filtered.filter((task) => task.status === column).map((task) => <article className="task-kanban-card" key={task.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)} onClick={() => setDetail(task)}><strong>{task.title}</strong><span className={`priority priority--${task.priority}`}><i/>{taskPriorityLabels[task.priority]}</span><small>{names(task).employee}</small><small className={isTaskOverdue(task) ? 'task-overdue' : ''}><CalendarClock size={13}/>{dateLabel(task.dueDate)}{isTaskOverdue(task) ? ' · Просрочена' : ''}</small><small>{names(task).contact ?? names(task).deal ?? 'Без связи'}</small></article>)}{!filtered.some((task) => task.status === column) && <p className="task-column-empty">Нет задач</p>}</section>)}</div>}
    {formTask !== undefined && <TaskForm task={formTask} employees={employees} contacts={contacts} deals={deals} saving={saving} onClose={() => setFormTask(undefined)} onSave={(values) => void save(values)}/>}
    {detail && <TaskDetails task={tasks.find((item) => item.id === detail.id) ?? detail} names={names(tasks.find((item) => item.id === detail.id) ?? detail)} onClose={() => setDetail(null)} onEdit={() => { setFormTask(tasks.find((item) => item.id === detail.id) ?? detail); setDetail(null); }} onDelete={() => setDeleteTarget(detail)} onStatus={(next) => void move(detail, next)}/>}
    {deleteTarget && <ConfirmDialog name={deleteTarget.title} busy={deleting} onCancel={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={remove}/>}
    {toast && <div className="contacts-toast" role="status"><span>{toast}</span><button aria-label="Закрыть" onClick={() => setToast('')}><X size={16}/></button></div>}
  </main>;
}

function TaskForm({ task, employees, contacts, deals, saving, onClose, onSave }: { task: Task | null; employees: Employee[]; contacts: Contact[]; deals: Deal[]; saving: boolean; onClose: () => void; onSave: (input: TaskInput) => void }) {
  const [title, setTitle] = useState(task?.title ?? ''); const [description, setDescription] = useState(task?.description ?? ''); const [dueDate, setDueDate] = useState(dateInput(task?.dueDate)); const [status, setStatus] = useState<TaskStatus>(task?.status === 'cancelled' ? 'pending' : task?.status ?? 'pending'); const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium'); const [assigned, setAssigned] = useState(task?.assignedEmployeeId ?? employees[0]?.id ?? ''); const [contact, setContact] = useState(task?.relatedContactId ?? ''); const [deal, setDeal] = useState(task?.relatedDealId ?? ''); const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!title.trim()) { setError('Введите название задачи.'); return; } if (!dueDate || !Number.isFinite(Date.parse(dueDate))) { setError('Укажите корректный срок выполнения.'); return; } if (!assigned) { setError('Выберите ответственного сотрудника.'); return; } onSave({ title, description, dueDate: new Date(dueDate).toISOString(), status, priority, assignedEmployeeId: assigned, relatedContactId: contact || null, relatedDealId: deal || null }); };
  return <div className="contacts-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="contacts-dialog task-form-dialog" role="dialog" aria-modal="true" aria-labelledby="task-form-title"><div className="contacts-dialog__header"><div><span className="eyebrow">Рабочее пространство</span><h2 id="task-form-title">{task ? 'Редактировать задачу' : 'Новая задача'}</h2><p>Заполните основные сведения и назначьте ответственного.</p></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X/></button></div><form className="contact-form" onSubmit={submit}><div className="contact-form__grid"><label className="contact-field contact-field--wide"><span>Название задачи *</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, подготовить предложение"/></label><label className="contact-field contact-field--wide"><span>Описание</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3}/></label><label className="contact-field"><span>Статус</span><select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>{taskStatuses.map((item) => <option value={item} key={item}>{taskStatusLabels[item]}</option>)}</select></label><label className="contact-field"><span>Приоритет</span><select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>{Object.entries(taskPriorityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label className="contact-field"><span>Ответственный *</span><select value={assigned} onChange={(event) => setAssigned(event.target.value)}>{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label><label className="contact-field"><span>Срок выполнения *</span><input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)}/></label><label className="contact-field"><span>Связанный контакт</span><select value={contact} onChange={(event) => setContact(event.target.value)}><option value="">Не выбран</option>{contacts.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label><label className="contact-field"><span>Связанная сделка</span><select value={deal} onChange={(event) => setDeal(event.target.value)}><option value="">Не выбрана</option>{deals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>{error && <p className="contact-field__error" role="alert">{error}</p>}<div className="contact-form__footer"><span className="contact-form__required">* Обязательные поля</span><div><button type="button" className="secondary-button" onClick={onClose}>Отмена</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить задачу'}</button></div></div></form></section></div>;
}

function TaskDetails({ task, names, onClose, onEdit, onDelete, onStatus }: { task: Task; names: { employee: string; contact?: string; deal?: string }; onClose: () => void; onEdit: () => void; onDelete: () => void; onStatus: (status: TaskStatus) => void }) {
  return <div className="contacts-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="contacts-dialog task-details" role="dialog" aria-modal="true" aria-labelledby="task-detail-title"><div className="contacts-dialog__header"><div><span className="eyebrow">Карточка задачи</span><h2 id="task-detail-title">{task.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X/></button></div><div className="task-detail-content"><p>{task.description || 'Описание не добавлено.'}</p><dl><dt>Статус</dt><dd><select value={task.status === 'cancelled' ? 'pending' : task.status} onChange={(event) => onStatus(event.target.value as TaskStatus)}>{taskStatuses.map((item) => <option value={item} key={item}>{taskStatusLabels[item]}</option>)}</select></dd><dt>Приоритет</dt><dd>{taskPriorityLabels[task.priority]}</dd><dt>Ответственный</dt><dd>{names.employee}</dd><dt>Срок выполнения</dt><dd>{dateLabel(task.dueDate)}{isTaskOverdue(task) && <span className="task-overdue"> · Просрочена</span>}</dd><dt>Контакт</dt><dd>{names.contact ?? 'Не указан'}</dd><dt>Сделка</dt><dd>{names.deal ?? 'Не указана'}</dd><dt>Создана</dt><dd>{dateLabel(task.createdAt)}</dd><dt>Обновлена</dt><dd>{dateLabel(task.updatedAt ?? task.createdAt)}</dd></dl></div><div className="contact-form__footer"><button className="danger-quiet-button" onClick={onDelete}><Trash2 size={15}/>Удалить</button><div><button className="secondary-button" onClick={onClose}>Закрыть</button><button className="primary-button" onClick={onEdit}>Редактировать</button></div></div></section></div>;
}
