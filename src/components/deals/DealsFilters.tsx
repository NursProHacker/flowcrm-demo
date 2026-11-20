import { Search, X } from 'lucide-react';
import type { DealStage, Employee } from '../../types/domain';
import { dealStageOptions, pluralizeDeals } from '../../utils/deal-format';

export interface DealFilterValues {
  query: string;
  stage: DealStage | 'all';
  employeeId: string | 'all';
}

interface DealsFiltersProps {
  value: DealFilterValues;
  employees: Employee[];
  resultCount: number;
  totalCount: number;
  onChange: (value: DealFilterValues) => void;
}

export function DealsFilters({ value, employees, resultCount, totalCount, onChange }: DealsFiltersProps) {
  const hasFilters = value.query.length > 0 || value.stage !== 'all' || value.employeeId !== 'all';
  return (
    <section className="deals-toolbar" aria-label="Поиск и фильтры сделок">
      <div className="deals-toolbar__controls">
        <label className="contacts-search deals-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Поиск сделки</span>
          <input type="search" value={value.query} onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder="Название, контакт или компания" />
          {value.query && <button type="button" className="contacts-search__clear" aria-label="Очистить поиск" onClick={() => onChange({ ...value, query: '' })}><X size={15} /></button>}
        </label>
        <label className="contacts-filter">
          <span className="sr-only">Этап сделки</span>
          <select value={value.stage} onChange={(event) => onChange({ ...value, stage: event.target.value as DealFilterValues['stage'] })}>
            <option value="all">Все этапы</option>
            {dealStageOptions.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
          </select>
        </label>
        <label className="contacts-filter">
          <span className="sr-only">Ответственный сотрудник</span>
          <select value={value.employeeId} onChange={(event) => onChange({ ...value, employeeId: event.target.value })}>
            <option value="all">Все сотрудники</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
          </select>
        </label>
        {hasFilters && <button className="contacts-reset" type="button" onClick={() => onChange({ query: '', stage: 'all', employeeId: 'all' })}>Сбросить</button>}
      </div>
      <p className="contacts-results" aria-live="polite">Показано {resultCount} из {totalCount} {pluralizeDeals(totalCount)}</p>
    </section>
  );
}
