import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BellRing, Building2, Check, Download, Globe2, Monitor, Moon, Palette, RotateCcw, Shield, Sun, UserRound, UsersRound, Database } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { services } from '../services/repositories';
import { settingsService } from '../services/settings-service';
import { useAppSettings } from '../contexts/useAppSettings';
import type { Employee, Organization } from '../types/domain';
import type { AppSettings, NotificationPreferences } from '../types/settings';
import { DEFAULT_CURRENCY, formatCurrency } from '../utils/currency';

type TabId = 'profile' | 'organization' | 'appearance' | 'region' | 'notifications' | 'team' | 'data';
const tabs: Array<{ id: TabId; label: string; icon: typeof UserRound }> = [
  { id: 'profile', label: 'Профиль', icon: UserRound }, { id: 'organization', label: 'Организация', icon: Building2 }, { id: 'appearance', label: 'Внешний вид', icon: Palette },
  { id: 'region', label: 'Язык и регион', icon: Globe2 }, { id: 'notifications', label: 'Уведомления', icon: BellRing }, { id: 'team', label: 'Команда и доступ', icon: UsersRound }, { id: 'data', label: 'Данные и резервные копии', icon: Database },
];
const roleLabels: Record<Employee['role'], string> = { owner: 'Владелец', admin: 'Администратор', manager: 'Руководитель', sales: 'Менеджер по продажам', support: 'Поддержка' };
const dealStageLabels: Record<string, string> = { new: 'Новая', qualification: 'Квалификация', proposal: 'Предложение', negotiation: 'Переговоры', won: 'Успешно', lost: 'Закрыта' };
const taskStatusLabels: Record<string, string> = { pending: 'Ожидает', in_progress: 'В работе', completed: 'Выполнена', cancelled: 'Отменена' };
const priorityLabels: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный' };
const required = (value: string) => value.trim().length > 0;
const saveDownload = (name: string, contents: string, type: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
};
const csv = (records: Array<Record<string, unknown>>) => {
  if (!records.length) return '\uFEFF';
  const keys = Object.keys(records[0]!);
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return `\uFEFF${[keys.map(cell).join(';'), ...records.map((row) => keys.map((key) => cell(row[key])).join(';'))].join('\r\n')}`;
};
const initialsFor = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('ru-RU');

export function SettingsPage() {
  const { settings, updateSettings, t } = useAppSettings();
  const [tab, setTab] = useState<TabId>('profile');
  const [profileDraft, setProfileDraft] = useState(settings.profile);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationDraft, setOrganizationDraft] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgs, staff] = await Promise.all([services.organizations.getAll(), services.employees.getAll()]);
      const org = orgs[0] ?? null;
      setOrganization(org); setOrganizationDraft(org); setEmployees(staff);
      setFeedback(null);
    } catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось загрузить настройки.' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!required(profileDraft.fullName) || !required(profileDraft.email) || !/^\S+@\S+\.\S+$/.test(profileDraft.email)) { setFeedback({ type: 'error', text: 'Укажите имя и корректный адрес электронной почты.' }); return; }
    try {
      const { employeeId, fullName, email } = profileDraft;
      await services.employees.update(employeeId, { fullName: fullName.trim(), email: email.trim() });
      const normalized = { ...profileDraft, fullName: fullName.trim(), email: email.trim(), avatarInitials: profileDraft.avatarInitials.trim() || initialsFor(fullName) };
      updateSettings({ profile: normalized }); setProfileDraft(normalized);
      setFeedback({ type: 'success', text: 'Профиль сохранён.' });
    } catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось сохранить профиль.' }); }
  };
  const saveOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organizationDraft || !required(organizationDraft.name)) { setFeedback({ type: 'error', text: 'Название организации обязательно.' }); return; }
    try {
      const saved = organization ? await services.organizations.update(organization.id, organizationDraft) : await services.organizations.create({ ...organizationDraft, id: `organization-${crypto.randomUUID()}` });
      setOrganization(saved); setOrganizationDraft(saved); setFeedback({ type: 'success', text: 'Данные организации сохранены.' });
    } catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось сохранить организацию.' }); }
  };
  const saveEmployee = async (employee: Employee) => {
    try {
      const saved = await services.employees.update(employee.id, { fullName: employee.fullName, email: employee.email, role: employee.role, avatarUrl: employee.avatarUrl, isActive: employee.isActive });
      setEmployees((current) => current.map((item) => item.id === saved.id ? saved : item));
      if (saved.id === settings.profile.employeeId) {
        const profile = { ...settings.profile, fullName: saved.fullName, email: saved.email, avatarInitials: initialsFor(saved.fullName) };
        updateSettings({ profile }); setProfileDraft(profile);
      }
      setFeedback({ type: 'success', text: 'Данные сотрудника сохранены.' });
    }
    catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось сохранить сотрудника.' }); }
  };
  const setPreference = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => { updateSettings({ [key]: value } as Pick<AppSettings, Key>); setFeedback({ type: 'success', text: 'Настройки сохранены.' }); };
  const setNotification = (key: keyof NotificationPreferences, value: boolean) => setPreference('notifications', { ...settings.notifications, [key]: value });
  const exportAll = async () => {
    try {
      const [contacts, deals, tasks, calendarEvents, employeesData, activities, organizations] = await Promise.all([services.contacts.getAll(), services.deals.getAll(), services.tasks.getAll(), services.calendarEvents.getAll(), services.employees.getAll(), services.activities.getAll(), services.organizations.getAll()]);
      saveDownload(`flowcrm-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), formatVersion: 1, settings: settingsService.get(), contacts, deals, tasks, calendarEvents, employees: employeesData, activities, organizations }, null, 2), 'application/json;charset=utf-8');
      setFeedback({ type: 'success', text: 'Резервная копия JSON подготовлена.' });
    } catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось экспортировать резервную копию.' }); }
  };
  const exportCollection = async (collection: 'contacts' | 'deals' | 'tasks' | 'calendarEvents') => {
    try {
      const records = await services[collection].getAll();
      const data: Array<Record<string, unknown>> = collection === 'contacts' ? (records as Awaited<ReturnType<typeof services.contacts.getAll>>).map((item) => ({ Имя: item.fullName, Компания: item.company, Телефон: item.phone, Email: item.email, Тип: item.type === 'lead' ? 'Потенциальный клиент' : item.type === 'customer' ? 'Клиент' : 'Партнёр', Статус: item.status === 'active' ? 'Активный' : 'Неактивный', Источник: item.source, Примечания: item.notes, Создан: item.createdAt }))
        : collection === 'deals' ? (records as Awaited<ReturnType<typeof services.deals.getAll>>).map((item) => ({ Сделка: item.title, Сумма: formatCurrency(item.amount), Валюта: settings.currency, Этап: dealStageLabels[item.stageId], Приоритет: priorityLabels[item.priority], Контакт: item.contactId, Ответственный: item.assignedEmployeeId, 'Плановое закрытие': item.expectedCloseDate ?? '', Создана: item.createdAt, Обновлена: item.updatedAt, Примечания: item.notes }))
          : collection === 'tasks' ? (records as Awaited<ReturnType<typeof services.tasks.getAll>>).map((item) => ({ Задача: item.title, Описание: item.description, Статус: taskStatusLabels[item.status], Приоритет: priorityLabels[item.priority], Ответственный: item.assignedEmployeeId, Срок: item.dueDate, Контакт: item.relatedContactId ?? '', Сделка: item.relatedDealId ?? '', Создана: item.createdAt }))
            : (records as Awaited<ReturnType<typeof services.calendarEvents.getAll>>).map((item) => ({ Событие: item.title, Описание: item.description, Начало: item.startAt, Окончание: item.endAt, Контакт: item.relatedContactId ?? '', Сделка: item.relatedDealId ?? '', Место: item.location ?? '' }));
      const filename = { contacts: 'kontakty', deals: 'sdelki', tasks: 'zadachi', calendarEvents: 'sobitiya' }[collection];
      saveDownload(`flowcrm-${filename}.csv`, csv(data), 'text/csv;charset=utf-8');
      setFeedback({ type: 'success', text: 'CSV-файл подготовлен.' });
    } catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось подготовить CSV-файл.' }); }
  };
  const resetData = async () => {
    setResetting(true);
    try {
      await Promise.all([services.contacts.reset(), services.deals.reset(), services.tasks.reset(), services.calendarEvents.reset(), services.employees.reset(), services.activities.reset(), services.organizations.reset()]);
      const restoredProfile = await services.employees.getById(settings.profile.employeeId);
      if (restoredProfile) await services.employees.update(restoredProfile.id, { fullName: settings.profile.fullName, email: settings.profile.email });
      setResetOpen(false); await load(); setFeedback({ type: 'success', text: 'Демонстрационные данные восстановлены.' });
    } catch (error) { setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось восстановить данные.' }); }
    finally { setResetting(false); }
  };
  const selectedTab = tabs.find((item) => item.id === tab) ?? tabs[0]!;
  const SectionIcon = selectedTab.icon;

  return <main className="main-content settings-page">
      <div className="settings-heading"><div><p className="eyebrow">FlowCRM</p><h2>{t('Настройки')}</h2><p>{t('Настройте рабочее пространство под себя и команду.')}</p></div></div>
    {feedback && <div className={`settings-feedback settings-feedback--${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}><span>{feedback.type === 'success' ? <Check size={16} /> : '!'}</span>{feedback.text}<button type="button" aria-label="Закрыть сообщение" onClick={() => setFeedback(null)}>×</button></div>}
    {loading ? <div className="loading-state" role="status"><span className="loading-spinner" />Загружаем настройки…</div> : <div className="settings-layout">
      <nav className="settings-nav" aria-label="Разделы настроек">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={tab === id ? 'settings-nav__item settings-nav__item--active' : 'settings-nav__item'} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setFeedback(null); }}><Icon size={17} /><span>{t(label)}</span></button>)}</nav>
      <section className="settings-content"><header className="settings-section-heading"><span><SectionIcon size={19} /></span><div><h3>{t(selectedTab.label)}</h3><p>{tab === 'team' ? 'Справочник сотрудников демонстрационной команды.' : tab === 'data' ? 'Локальные файлы экспорта и управление демо-записями.' : 'Изменения сохраняются в этом браузере.'}</p></div></header>
        {tab === 'profile' && <form className="settings-form" onSubmit={(event) => void saveProfile(event)}><div className="settings-avatar-preview"><span className="avatar avatar--blue">{profileDraft.avatarInitials || initialsFor(profileDraft.fullName)}</span><div><strong>Аватар профиля</strong><small>Показываются инициалы, изображения не загружаются.</small></div><label className="settings-field settings-field--compact"><span>Инициалы</span><input maxLength={3} value={profileDraft.avatarInitials} onChange={(event) => setProfileDraft({ ...profileDraft, avatarInitials: event.target.value })} /></label></div><div className="settings-fields-grid"><label className="settings-field"><span>Полное имя <b>*</b></span><input required value={profileDraft.fullName} onChange={(event) => setProfileDraft({ ...profileDraft, fullName: event.target.value, avatarInitials: initialsFor(event.target.value) })} /></label><label className="settings-field"><span>Должность</span><input value={profileDraft.jobTitle} onChange={(event) => setProfileDraft({ ...profileDraft, jobTitle: event.target.value })} /></label><label className="settings-field"><span>Email <b>*</b></span><input type="email" required value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} /></label><label className="settings-field"><span>Телефон</span><input type="tel" value={profileDraft.phone} onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })} /></label></div><button className="primary-button" type="submit">Сохранить профиль</button><p className="settings-note">Это локальный демонстрационный профиль. Авторизация и смена пароля не реализованы.</p></form>}
        {tab === 'organization' && organizationDraft && <form className="settings-form" onSubmit={(event) => void saveOrganization(event)}><div className="settings-logo-placeholder"><span>{organizationDraft.logoText || organizationDraft.name.slice(0, 2).toLocaleUpperCase('ru-RU')}</span><div><strong>Логотип организации</strong><small>Заглушка логотипа; загрузка изображений не поддерживается.</small></div><input aria-label="Текст логотипа" maxLength={4} value={organizationDraft.logoText ?? ''} placeholder="Flow" onChange={(event) => setOrganizationDraft({ ...organizationDraft, logoText: event.target.value })} /></div><div className="settings-fields-grid"><label className="settings-field"><span>Название <b>*</b></span><input required value={organizationDraft.name} onChange={(event) => setOrganizationDraft({ ...organizationDraft, name: event.target.value })} /></label><label className="settings-field"><span>Описание</span><input value={organizationDraft.description ?? organizationDraft.businessType} onChange={(event) => setOrganizationDraft({ ...organizationDraft, description: event.target.value, businessType: event.target.value })} /></label><label className="settings-field"><span>Телефон</span><input type="tel" value={organizationDraft.phone ?? ''} onChange={(event) => setOrganizationDraft({ ...organizationDraft, phone: event.target.value })} /></label><label className="settings-field"><span>Email</span><input type="email" value={organizationDraft.email ?? ''} onChange={(event) => setOrganizationDraft({ ...organizationDraft, email: event.target.value })} /></label><label className="settings-field"><span>Веб-сайт</span><input type="url" placeholder="https://example.kz" value={organizationDraft.website ?? ''} onChange={(event) => setOrganizationDraft({ ...organizationDraft, website: event.target.value })} /></label><label className="settings-field"><span>Адрес</span><input value={organizationDraft.address ?? ''} onChange={(event) => setOrganizationDraft({ ...organizationDraft, address: event.target.value })} /></label></div><div className="settings-readonly"><span>Валюта по умолчанию</span><strong>{organizationDraft.currency || DEFAULT_CURRENCY} · {formatCurrency(1)}</strong><small>Формат валюты выбирается в разделе «Язык и регион».</small></div><button className="primary-button" type="submit">Сохранить организацию</button></form>}
        {tab === 'appearance' && <div className="settings-options"><p className="settings-copy">Тема применяется ко всему интерфейсу сразу и сохраняется для этого браузера.</p><div className="settings-theme-grid">{([{ value: 'light', title: 'Светлая', icon: Sun }, { value: 'dark', title: 'Тёмная', icon: Moon }, { value: 'system', title: 'Системная', icon: Monitor }] as const).map(({ value, title, icon: Icon }) => <button key={value} type="button" className={settings.theme === value ? 'theme-choice theme-choice--active' : 'theme-choice'} onClick={() => setPreference('theme', value)}><span><Icon size={19} /></span><strong>{title}</strong><small>{value === 'system' ? 'Как в настройках устройства' : value === 'dark' ? 'Тёмные поверхности' : 'Светлые поверхности'}</small>{settings.theme === value && <Check size={16} />}</button>)}</div></div>}
        {tab === 'region' && <div className="settings-form">
          <div className="settings-fields-grid">
            <label className="settings-field"><span>{t('Язык интерфейса')}</span><select value={settings.language} onChange={(event) => { const language = event.target.value as AppSettings['language']; updateSettings({ language, locale: language === 'ru' ? 'ru-KZ' : language === 'kk' ? 'kk-KZ' : 'en-KZ' }); }}><option value="ru">Русский</option><option value="kk">Қазақша</option><option value="en">English</option></select></label>
            <div className="settings-readonly"><span>{t('Регион')}</span><strong>{t('Казахстан')}</strong><small>{t('Региональные форматы используют часовой пояс и форматы Казахстана.')}</small></div>
            <label className="settings-field"><span>{t('Формат даты')}</span><select value={settings.dateFormat} onChange={(event) => setPreference('dateFormat', event.target.value as AppSettings['dateFormat'])}><option value="locale">{t('По региону')}</option><option value="dd.MM.yyyy">ДД.ММ.ГГГГ</option><option value="yyyy-MM-dd">ГГГГ-ММ-ДД</option></select></label>
            <label className="settings-field"><span>{t('Формат времени')}</span><select value={settings.timeFormat} onChange={(event) => setPreference('timeFormat', event.target.value as AppSettings['timeFormat'])}><option value="24h">{t('24 часа')}</option><option value="12h">{t('12 часов')}</option></select></label>
            <label className="settings-field"><span>{t('Часовой пояс Казахстана')}</span><select value={settings.timeZone} onChange={(event) => setPreference('timeZone', event.target.value)}>
              <option value="Asia/Qyzylorda">{t('Кызылорда (UTC+5)')}</option><option value="Asia/Almaty">{t('Астана, Алматы, Шымкент (UTC+5)')}</option><option value="Asia/Aqtobe">{t('Актобе (UTC+5)')}</option><option value="Asia/Atyrau">{t('Атырау (UTC+5)')}</option><option value="Asia/Aqtau">{t('Актау (UTC+5)')}</option><option value="Asia/Oral">{t('Уральск (UTC+5)')}</option>
            </select></label>
            <label className="settings-field"><span>{t('Валюта отображения')}</span><select value={settings.currency} onChange={(event) => setPreference('currency', event.target.value as AppSettings['currency'])}><option value="KZT">KZT — Қазақстан теңгесі</option><option value="USD">USD — Доллар США</option><option value="EUR">EUR — Евро</option><option value="RUB">RUB — Российский рубль</option></select></label>
          </div><div className="settings-note">Валюта меняет только формат отображения. Пересчёт и изменение числовых сумм не выполняются.</div>
        </div>}
        {tab === 'notifications' && <div className="settings-options"><p className="settings-copy">Настройки влияют только на уведомления внутри приложения. Фоновые и внешние сообщения не отправляются.</p>{([{ key: 'taskDue', label: 'Напоминания о сроке задачи', detail: 'Показывать задачи, срок которых наступает сегодня.' }, { key: 'overdueTasks', label: 'Просроченные задачи', detail: 'Показывать незавершённые задачи с прошедшим сроком.' }, { key: 'upcomingEvents', label: 'Ближайшие события', detail: 'Показывать предстоящие события календаря.' }, { key: 'dealStageChanges', label: 'Изменения этапов сделок', detail: 'Показывать уведомления об изменении этапа сделки.' }] as const).map(({ key, label, detail }) => <label className="settings-toggle-row" key={key}><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={settings.notifications[key]} onChange={(event) => setNotification(key, event.target.checked)} /></label>)}<div className="settings-integration-note"><Shield size={17} /> Email, WhatsApp, push-уведомления и работа в фоне пока не подключены.</div></div>}
        {tab === 'team' && <div className="settings-options"><div className="settings-demo-banner"><Shield size={16} />Демонстрационный доступ: приглашения и защищённые роли требуют серверной авторизации.</div><div className="settings-team-list">{employees.map((employee) => <article className="settings-team-row" key={employee.id}><div className="avatar avatar--blue">{initialsFor(employee.fullName)}</div><div className="settings-team-row__fields"><label className="settings-field"><span>Имя</span><input value={employee.fullName} onChange={(event) => setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, fullName: event.target.value } : item))} /></label><label className="settings-field"><span>Email</span><input type="email" value={employee.email} onChange={(event) => setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, email: event.target.value } : item))} /></label></div><div className="settings-team-row__meta"><span className="role-pill">{roleLabels[employee.role]}</span><label className="settings-active"><input type="checkbox" checked={employee.isActive ?? true} onChange={(event) => setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, isActive: event.target.checked } : item))} />Активен</label><button type="button" className="secondary-button" onClick={() => void saveEmployee(employee)}>Сохранить</button></div></article>)}</div></div>}
        {tab === 'data' && <div className="settings-options"><p className="settings-copy">Экспорт создаёт файл в браузере. Резервная копия включает CRM-записи, демонстрационные настройки профиля и время создания файла.</p><button className="backup-json-button" type="button" onClick={() => void exportAll()}><Download size={17} /><span><strong>Экспортировать все данные в JSON</strong><small>Контакты, сделки, задачи, события, команда, активности и организация</small></span></button><div className="backup-csv-grid">{([{ key: 'contacts', label: 'Контакты CSV' }, { key: 'deals', label: 'Сделки CSV' }, { key: 'tasks', label: 'Задачи CSV' }, { key: 'calendarEvents', label: 'События CSV' }] as const).map(({ key, label }) => <button className="secondary-button" key={key} type="button" onClick={() => void exportCollection(key)}><Download size={15} />{label}</button>)}</div><section className="settings-danger-zone"><div><strong>Сбросить демонстрационные данные</strong><p>Заменит локальные записи на исходные демонстрационные данные. Это действие нельзя отменить.</p></div><button className="danger-button" type="button" onClick={() => setResetOpen(true)}><RotateCcw size={15} />Сбросить данные</button></section><p className="settings-note">Сброс не затрагивает настройки профиля, интерфейса и уведомлений. Локальные данные доступны только в текущем браузере.</p></div>}
      </section>
    </div>}
    {resetOpen && <ConfirmDialog name="все демонстрационные данные CRM" title="Сбросить данные CRM?" description="Все текущие контакты, сделки, задачи, события и действия будут заменены исходными демо-записями. Настройки интерфейса останутся. Это действие нельзя отменить." confirmLabel="Сбросить данные" busy={resetting} onCancel={() => { if (!resetting) setResetOpen(false); }} onConfirm={resetData} />}
  </main>;
}
