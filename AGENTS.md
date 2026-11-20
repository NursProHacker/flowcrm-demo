# FlowCRM — Development Instructions

## Project Overview
FlowCRM is a universal CRM demonstration application for small and medium-sized businesses.

The initial version is a frontend-first demo with persistent local demo data. The architecture must allow a future migration to Supabase and PostgreSQL.

## Technology Stack
- React
- TypeScript with strict mode
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Recharts
- LocalStorage for demo persistence

Use compatible stable dependency versions. Verify the correct Tailwind configuration for the installed version.

## Architecture Rules
- Separate UI components, business logic, data access and types.
- Use reusable components.
- Keep business data out of presentation components.
- All data access must go through the service/repository layer.
- Never access LocalStorage directly inside UI components.
- Use typed interfaces for all domain entities.
- Avoid `any`.
- Keep components reasonably small and focused.
- Avoid duplicated logic.
- Use clear and consistent naming.
- Do not introduce unnecessary dependencies.
- Prefer simple solutions over premature abstractions.

## Domain Entities
The application must support:
- Contact
- Deal
- Task
- CalendarEvent
- Employee
- Activity
- Organization

## Design Rules
- Light theme by default.
- Premium, minimal SaaS visual language.
- White and light gray surfaces.
- Blue primary accent.
- Consistent spacing and typography.
- Responsive desktop, tablet and mobile layouts.
- Use Lucide icons.
- Avoid excessive shadows, gradients and decorative elements.
- All interface text must be in Russian.

## Functionality Rules
- All visible buttons must have working actions.
- All forms must validate input.
- Destructive actions require confirmation.
- Loading, empty and error states must be handled.
- Changes must persist after page refresh.
- Demo data must be clearly identified as fictional.

## Code Quality
- Keep TypeScript strict.
- Avoid unnecessary code duplication.
- Do not suppress TypeScript errors without justification.
- Remove unused imports.
- Keep dependencies minimal.
- Ensure components are accessible.
- Test important user flows.

## Development Workflow
After each significant implementation:
1. Run TypeScript checks.
2. Run the production build.
3. Fix errors before proceeding.
4. Report files created and changed.
5. Document known limitations.

Do not silently remove existing functionality.

## Security Limitations
This initial demo is not production-ready.
LocalStorage is not secure storage.
Do not store passwords, authentication secrets or real sensitive customer information.
Do not claim that demo authentication or integrations are production-ready.
