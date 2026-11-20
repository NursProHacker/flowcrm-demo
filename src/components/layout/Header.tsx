import { Bell, Menu, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { DashboardSnapshot } from '../../services/dashboard-service';

interface HeaderProps {
  title: string;
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
  snapshot: DashboardSnapshot | null;
}

export function Header({ title, mobileMenuOpen, onToggleMenu, snapshot }: HeaderProps) {
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

  return (
    <header className="topbar">
      <div className="topbar__title-wrap">
        <button
          className="icon-button topbar__menu"
          type="button"
          onClick={onToggleMenu}
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
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
            placeholder="Поиск по CRM"
            aria-label="Поиск по контактам и сделкам"
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
                  <span className="search-result__type">{result.type}</span>
                  <span className="search-result__copy"><strong>{result.title}</strong><small>{result.detail}</small></span>
                </Link>
              )) : <p className="search-empty">Ничего не найдено</p>}
            </div>
          )}
        </div>

        <div className="notification-wrap">
          <button
            className={`icon-button notification-button${notificationsOpen ? ' icon-button--selected' : ''}`}
            type="button"
            aria-label="Уведомления"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={19} />
            <span className="notification-dot" aria-hidden="true" />
          </button>
          {notificationsOpen && (
            <div className="notification-popover">
              <div className="popover-heading"><strong>Уведомления</strong><span>Последние события</span></div>
              {snapshot?.activities.slice(0, 3).map((activity) => (
                <div className="notification-item" key={activity.id}>
                  <span className="notification-item__dot" />
                  <span>{activity.description}</span>
                </div>
              ))}
              {!snapshot?.activities.length && <p className="search-empty">Новых уведомлений нет</p>}
            </div>
          )}
        </div>
        <div className="topbar-user" aria-label="Текущий пользователь: Мария Смирнова">
          <div className="avatar avatar--blue" aria-hidden="true">МС</div>
          <span>Мария</span>
        </div>
      </div>
    </header>
  );
}
