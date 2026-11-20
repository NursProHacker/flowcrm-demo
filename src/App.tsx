import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const SectionPage = lazy(() => import('./pages/SectionPage').then((module) => ({ default: module.SectionPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((module) => ({ default: module.ContactsPage })));
const DealsPage = lazy(() => import('./pages/DealsPage').then((module) => ({ default: module.DealsPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));

function RouteLoading() {
  return <main className="main-content"><div className="loading-state" role="status"><span className="loading-spinner" />Открываем раздел…</div></main>;
}

function loadSection() {
  return <Suspense fallback={<RouteLoading />}><SectionPage /></Suspense>;
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
        <Route path="reports" element={loadSection()} />
        <Route path="settings" element={loadSection()} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
