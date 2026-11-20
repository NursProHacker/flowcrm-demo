import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ListTodo,
  Settings2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useOutletContext } from 'react-router';
import type { DashboardState } from '../hooks/useDashboardSnapshot';

interface SectionDetails {
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  metricLabel: string;
  metric: (state: DashboardState) => string;
}

const sections: Record<string, SectionDetails> = {
  '/tasks': {
    title: 'Задачи', description: 'Планируйте работу команды и держите важные дела под контролем.',
    detail: 'В будущем здесь будут фильтры по сроку, приоритету и ответственному. Ближайшие задачи уже видны на обзоре.',
    icon: ListTodo, metricLabel: 'На сегодня', metric: (state) => state.status === 'ready' ? String(state.snapshot.tasksDueTodayCount) : '—',
  },
  '/calendar': {
    title: 'Календарь', description: 'Встречи и события команды с привязкой к клиентам и сделкам.',
    detail: 'Календарные события хранятся в демонстрационном слое данных. Представление календаря будет добавлено следующим этапом.',
    icon: CalendarDays, metricLabel: 'Событий в демо', metric: (state) => state.status === 'ready' ? String(state.snapshot.calendarEvents.length) : '—',
  },
  '/reports': {
    title: 'Отчёты', description: 'Понимайте динамику продаж и нагрузку команды по ключевым показателям.',
    detail: 'Графики на обзоре уже используют данные из репозитория. В этом разделе появятся подробные отчёты и фильтры по периоду.',
    icon: BarChart3, metricLabel: 'Дней в отчёте', metric: (state) => state.status === 'ready' ? String(state.snapshot.sales.length) : '—',
  },
  '/settings': {
    title: 'Настройки', description: 'Управление организацией, командой и предпочтениями CRM.',
    detail: 'Профиль демонстрационной организации и сотрудники заложены в типы данных. Настройки пока не меняют сохранённые данные.',
    icon: Settings2, metricLabel: 'Сотрудников в демо', metric: (state) => state.status === 'ready' ? String(state.snapshot.employees.length) : '—',
  },
};

export function SectionPage() {
  const { pathname } = useLocation();
  const { state } = useOutletContext<{ state: DashboardState }>();
  const section = sections[pathname] ?? sections['/reports'];
  if (!section) return null;
  const Icon = section.icon;

  return (
    <main className="main-content section-page">
      <div className="section-hero">
        <span className="section-hero__icon"><Icon size={24} strokeWidth={1.8} aria-hidden="true" /></span>
        <div className="section-hero__copy">
          <span className="eyebrow"><Sparkles size={14} aria-hidden="true" /> Раздел FlowCRM</span>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
      </div>

      <section className="section-preview">
        <div className="section-preview__main">
          <span className="section-preview__kicker">Следующий этап</span>
          <h3>Рабочее пространство для раздела «{section.title.toLocaleLowerCase('ru-RU')}»</h3>
          <p>{section.detail}</p>
          <Link className="primary-link-button" to="/"><span>Вернуться к обзору</span><ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="section-preview__metric">
          <span className="section-preview__metric-icon"><Icon size={20} aria-hidden="true" /></span>
          <strong>{section.metric(state)}</strong>
          <span>{section.metricLabel}</span>
          <small>Демо-данные</small>
        </div>
      </section>

      <div className="section-placeholder-grid">
        <div className="placeholder-tile"><span className="placeholder-tile__line placeholder-tile__line--short" /><span className="placeholder-tile__line" /><span className="placeholder-tile__line placeholder-tile__line--medium" /></div>
        <div className="placeholder-tile"><span className="placeholder-tile__line placeholder-tile__line--medium" /><span className="placeholder-tile__line" /><span className="placeholder-tile__line placeholder-tile__line--short" /></div>
        <div className="placeholder-tile"><span className="placeholder-tile__line" /><span className="placeholder-tile__line placeholder-tile__line--short" /><span className="placeholder-tile__line placeholder-tile__line--medium" /></div>
      </div>
    </main>
  );
}
