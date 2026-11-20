import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ContactRound,
  LayoutDashboard,
  ListTodo,
  Settings2,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router';

const primaryNavigation = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/deals', label: 'Сделки', icon: BriefcaseBusiness, end: false },
  { to: '/contacts', label: 'Контакты', icon: ContactRound, end: false },
  { to: '/tasks', label: 'Задачи', icon: ListTodo, end: false },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays, end: false },
  { to: '/reports', label: 'Отчёты', icon: ChartNoAxesCombined, end: false },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Закрыть меню"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`} aria-label="Главная навигация">
        <div className="sidebar__top">
          <NavLink className="brand" to="/" onClick={onClose} aria-label="FlowCRM — обзор">
            <span className="brand__mark" aria-hidden="true">
              <BarChart3 size={21} strokeWidth={2.4} />
            </span>
            <span className="brand__name">Flow<span>CRM</span></span>
          </NavLink>
          <button className="icon-button sidebar__close" type="button" onClick={onClose} aria-label="Закрыть меню">
            <X size={19} />
          </button>
        </div>

        <div className="sidebar__label">Рабочее пространство</div>
        <nav className="sidebar__nav">
          {primaryNavigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__spacer" />
        <div className="sidebar__bottom">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
          >
            <Settings2 size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>Настройки</span>
          </NavLink>
          <div className="sidebar-profile">
            <div className="avatar avatar--blue" aria-hidden="true">МС</div>
            <div className="sidebar-profile__copy">
              <strong>Мария Смирнова</strong>
              <span>Руководитель продаж</span>
            </div>
            <span className="sidebar-profile__status" aria-label="В сети" />
          </div>
        </div>
      </aside>
    </>
  );
}
