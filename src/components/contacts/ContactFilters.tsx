import { Search, X } from 'lucide-react';
import type { ContactStatus, ContactType } from '../../types/domain';

export interface ContactFilterValues {
  query: string;
  type: ContactType | 'all';
  status: ContactStatus | 'all';
}

interface ContactFiltersProps {
  value: ContactFilterValues;
  onChange: (value: ContactFilterValues) => void;
  resultCount: number;
  totalCount: number;
}

export function ContactFilters({ value, onChange, resultCount, totalCount }: ContactFiltersProps) {
  const hasFilters = value.query.length > 0 || value.type !== 'all' || value.status !== 'all';

  return (
    <section className="contacts-toolbar" aria-label="Поиск и фильтры контактов">
      <div className="contacts-toolbar__controls">
        <label className="contacts-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Поиск контакта</span>
          <input
            type="search"
            value={value.query}
            onChange={(event) => onChange({ ...value, query: event.target.value })}
            placeholder="Имя, компания, телефон или почта"
          />
          {value.query && (
            <button type="button" className="contacts-search__clear" aria-label="Очистить поиск" onClick={() => onChange({ ...value, query: '' })}>
              <X size={15} />
            </button>
          )}
        </label>
        <label className="contacts-filter">
          <span className="sr-only">Тип контакта</span>
          <select value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as ContactFilterValues['type'] })}>
            <option value="all">Все типы</option>
            <option value="lead">Потенциальный клиент</option>
            <option value="customer">Клиент</option>
            <option value="partner">Партнёр</option>
          </select>
        </label>
        <label className="contacts-filter">
          <span className="sr-only">Статус контакта</span>
          <select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as ContactFilterValues['status'] })}>
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </label>
        {hasFilters && <button className="contacts-reset" type="button" onClick={() => onChange({ query: '', type: 'all', status: 'all' })}>Сбросить</button>}
      </div>
      <p className="contacts-results" aria-live="polite">
        {resultCount === totalCount ? `Всего ${totalCount}` : `Показано ${resultCount} из ${totalCount}`}
        {totalCount === 1 ? ' контакт' : totalCount > 1 && totalCount < 5 ? ' контакта' : ' контактов'}
      </p>
    </section>
  );
}
