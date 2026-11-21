import { Bell, Menu, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { DashboardSnapshot } from '../../services/dashboard-service';
import { useAppSettings } from '../../contexts/useAppSettings';
import { isTaskOverdue } from '../../services/task-service';

interface HeaderProps {
  title: string;
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
  snapshot: DashboardSnapshot | null;
}

export function Header({ title, mobileMenuOpen, onToggleMenu, snapshot }: HeaderProps) {
  const { settings, t } = useAppSettings();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase('en-US') === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        searchInput.current?.blur();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const results = useMemo(() => {
    if (!snapshot || normalizedQuery.length < 2) return [];
    const contacts = snapshot.contacts
      .filter((contact) => `${contact.fullName} ${contact.company}`.toLocaleLowerCase('ru-RU').includes(normalizedQuery))
      .map((contact) => ({ id: contact.id, title: contact.fullName, detail: contact.company, to: '/contacts', type: 'Контакт' }));
    const deals = snapshot.deals
      .filter((deal) => deal.title.toLocaleLowerCase('ru-RU').includes(normalizedQuery))
      .map((deal) => ({ id: deal.id, title: deal.title, detail: 'Сделка', to: '/deals', type: 'Сделка' }));
    return [...contacts, ...deals].slice(0, 5);
  }, [normalizedQuery, snapshot]);
  const notifications = useMemo(() => {
    if (!snapshot) return [];
    const now = new Date();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: settings.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const items: Array<{ id: string; text: string }> = [];
    if (settings.notifications.overdueTasks) snapshot.tasks.filter((task) => isTaskOverdue(task, now)).slice(0, 2).forEach((task) => items.push({ id: `overdue-${task.id}`, text: `Просрочена задача: ${task.title}` }));
    if (settings.notifications.taskDue) snapshot.tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled' && new Intl.DateTimeFormat('en-CA', { timeZone: settings.timeZone }).format(new Date(task.dueDate)) === today).slice(0, 2).forEach((task) => items.push({ id: `due-${task.id}`, text: `Срок задачи сегодня: ${task.title}` }));
    if (settings.notifications.upcomingEvents) snapshot.calendarEvents.filter((event) => Date.parse(event.startAt) >= now.getTime()).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)).slice(0, 2).forEach((event) => items.push({ id: `event-${event.id}`, text: `Скоро событие: ${event.title}` }));
    if (settings.notifications.dealStageChanges) snapshot.activities.filter((activity) => activity.entityType === 'deal' && activity.type === 'status_changed').slice(0, 3).forEach((activity) => items.push({ id: activity.id, text: activity.description }));
    return items.slice(0, 5);
  }, [settings.notifications, settings.timeZone, snapshot]);

  return (
    <header className="topbar">
      <div className="topbar__title-wrap">
        <button
          className="icon-button topbar__menu"
          type="button"
          onClick={onToggleMenu}
          aria-label={mobileMenuOpen ? t('Закрыть меню') : t('Открыть меню')}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="topbar__title">{title}</h1>
      </div>

      <div className="topbar__actions">
        <div className="global-search">
          <Search className="global-search__icon" size={18} aria-hidden="true" />
          <input
            ref={searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 140)}
            placeholder={t('Поиск по CRM')}
            aria-label={t('Поиск по контактам и сделкам')}
            aria-expanded={searchOpen && normalizedQuery.length >= 2}
          />
          <kbd className="global-search__shortcut">Ctrl K</kbd>
          {searchOpen && normalizedQuery.length >= 2 && (
            <div className="search-popover" role="listbox" aria-label="Результаты поиска">
              {results.length > 0 ? results.map((result) => (
                <Link
                  className="search-result"
                  key={`${result.type}-${result.id}`}
                  to={result.to}
                  onClick={() => setQuery('')}
                  role="option"
                >
                  <span className="search-result__type">{t(result.type)}</span>
                  <span className="search-result__copy"><strong>{result.title}</strong><small>{result.detail}</small></span>
                </Link>
              )) : <p className="search-empty">{t('Ничего не найдено')}</p>}
            </div>
          )}
        </div>

        <div className="notification-wrap">
          <button
            className={`icon-button notification-button${notificationsOpen ? ' icon-button--selected' : ''}`}
            type="button"
            aria-label={t('Уведомления')}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={19} />
            {notifications.length > 0 && <span className="notification-dot" aria-hidden="true" />}
          </button>
          {notificationsOpen && (
            <div className="notification-popover">
              <div className="popover-heading"><strong>{t('Уведомления')}</strong><span>{t('Последние события')}</span></div>
              {notifications.map((notification) => (
                <div className="notification-item" key={notification.id}>
                  <span className="notification-item__dot" />
                  <span>{notification.text}</span>
                </div>
              ))}
              {!notifications.length && <p className="search-empty">{t('Новых уведомлений нет')}</p>}
            </div>
          )}
        </div>
        <div className="topbar-user" aria-label={`${settings.language === 'ru' ? 'Текущий пользователь' : 'Current user'}: ${settings.profile.fullName}`}>
          <div className="avatar avatar--blue" aria-hidden="true">{settings.profile.avatarInitials}</div>
          <span>{settings.profile.fullName.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  );
}
