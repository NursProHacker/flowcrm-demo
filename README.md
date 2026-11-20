# FlowCRM

FlowCRM is a frontend-first CRM demonstration for small and medium-sized businesses. It includes a responsive dashboard and working Contacts and Deals modules, with descriptive placeholder routes for the remaining CRM sections.

## Technology stack

- React 19 and TypeScript with strict checking
- Vite 6
- Tailwind CSS 4 with its official Vite plugin
- React Router 7 in declarative mode
- Lucide React and Recharts (ready for use in later UI work)
- LocalStorage repository adapter for demo persistence
- ESLint 9 flat configuration

## Getting started

Install Node.js 20.19+ or 22.12+ and npm, then run:

```sh
npm install
npm run dev
```

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript project references |
| `npm run build` | Type-check and create a production build |

## Project architecture

- `src/components/` — reusable UI, layout, and feature components
- `src/pages/` — route-level pages for the dashboard, contacts, and other CRM sections
- `src/hooks/` — reusable React hooks
- `src/services/` — repository contracts, services, and data adapters
- `src/store/` — application state integration
- `src/types/` — shared domain types and unions
- `src/data/` — fictional demo fixtures
- `src/utils/` — shared pure helpers

UI code should call services rather than access browser storage. `Repository<TEntity>` defines the replaceable persistence contract; `LocalStorageRepository` implements it for this demo, and `EntityService` provides the UI-facing boundary. `demo-data.ts` provides fictional seed records. `dashboard-service.ts` derives dashboard metrics and chart series from service data. `contact-service.ts` and `deal-service.ts` add domain operations and backward-compatible field normalization on top of the repository. Deal changes are recorded in the existing activity collection. A future Supabase adapter can implement the same repository contract without changing presentation components. Storage keys are namespaced and versioned.

## Current limitations

- The dashboard, charts, search, notifications, navigation, Contacts CRUD, and Deals kanban/CRUD are implemented. Tasks, calendar, reports, and settings have descriptive placeholder pages; their full workflows are not yet implemented.
- Fictional seed records populate new LocalStorage collections. Reset restores those demo records.
- LocalStorage is browser-local and not secure. Do not store passwords, authentication secrets, or real sensitive customer information.
- There is no backend, authentication, synchronization, migration, or production-ready integration. Dashboard changes are not yet editable through the interface.
- Runtime validation and cross-tab conflict handling are not included in this foundation.
