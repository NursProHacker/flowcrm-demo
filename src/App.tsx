import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((module) => ({ default: module.ContactsPage })));
const DealsPage = lazy(() => import('./pages/DealsPage').then((module) => ({ default: module.DealsPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

function RouteLoading() {
  return <main className="main-content"><div className="loading-state" role="status"><span className="loading-spinner" />Открываем раздел…</div></main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Suspense fallback={<RouteLoading />}><DashboardPage /></Suspense>} />
        <Route path="deals" element={<Suspense fallback={<RouteLoading />}><DealsPage /></Suspense>} />
        <Route path="contacts" element={<Suspense fallback={<RouteLoading />}><ContactsPage /></Suspense>} />
        <Route path="tasks" element={<Suspense fallback={<RouteLoading />}><TasksPage /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<RouteLoading />}><CalendarPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<RouteLoading />}><ReportsPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<RouteLoading />}><SettingsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
