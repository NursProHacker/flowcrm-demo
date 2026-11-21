import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useDashboardSnapshot } from '../../hooks/useDashboardSnapshot';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppSettings } from '../../contexts/useAppSettings';

const pageTitles: Record<string, string> = {
  '/': 'Обзор',
  '/deals': 'Сделки',
  '/contacts': 'Контакты',
  '/tasks': 'Задачи',
  '/calendar': 'Календарь',
  '/reports': 'Отчёты',
  '/settings': 'Настройки',
};

export function AppLayout() {
  const location = useLocation();
  const { t } = useAppSettings();
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const mobileMenuOpen = openMenuPath === location.pathname;
  const state = useDashboardSnapshot();
  const snapshot = state.status === 'ready' ? state.snapshot : null;

  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuPath(null);
    };
    window.addEventListener('keydown', closeMenu);
    return () => window.removeEventListener('keydown', closeMenu);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setOpenMenuPath(null)} />
      <div className="app-main">
        <Header
          title={t(pageTitles[location.pathname] ?? 'FlowCRM')}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMenu={() => setOpenMenuPath((path) => path === location.pathname ? null : location.pathname)}
          snapshot={snapshot}
        />
        {state.status === 'error' ? (
          <main className="main-content">
            <div className="state-message state-message--error" role="alert">
              <AlertCircle size={22} aria-hidden="true" />
              <div><strong>Не удалось загрузить данные</strong><p>{state.message}</p></div>
            </div>
          </main>
        ) : (
          <Outlet context={{ state }} />
        )}
      </div>
    </div>
  );
}
