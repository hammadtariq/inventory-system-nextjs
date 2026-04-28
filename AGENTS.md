# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js inventory and accounting system using the Pages Router. Page UI lives in `pages/`, API routes in `pages/api/`, reusable React components in `components/`, SWR/data hooks in `hooks/`, and shared server/client utilities in `lib/` and `utils/`. Sequelize models are in `models/`, database migrations in `migrations/`, seed data in `seeders/`, and raw SQL helpers in `query/`. Tests live under `__tests__/`, grouped by feature such as `__tests__/api/purchase/`. Static assets are in `public/`, and CSS modules/global styles are in `styles/`.

## Build, Test, and Development Commands

- `pnpm dev`: start the local Next.js development server.
- `pnpm build`: create a production Next.js build.
- `pnpm start`: run the built application.
- `pnpm test`: run the Jest test suite.
- `pnpm build:test`: build the app, then run Jest.
- `pnpm lint`: run Next.js ESLint checks.
- `pnpm prettier:check`: verify formatting without modifying files.
- `pnpm prettier`: format files with Prettier.

## Coding Style & Naming Conventions

Use JavaScript/React with 2-space indentation, double quotes, and semicolons, matching the current codebase. Keep API handlers small and validate request bodies with `Joi`. Use camelCase for variables/functions, PascalCase for React components, and route filenames that follow Next.js conventions such as `pages/api/purchase/[id].js`. Prefer existing Ant Design patterns and CSS modules for UI work.

## Testing Guidelines

Jest is the test runner, with `node-mocks-http` used for API handler tests. Name tests by behavior and colocate them under feature folders, for example `__tests__/api/sales/approve.test.js`. For business-critical flows, cover success, validation failure, not-found cases, and state transitions. Run `pnpm test` before submitting changes; use `pnpm build:test` for broader regression checks.

## Commit & Pull Request Guidelines

Recent history uses conventional-style subjects such as `feat: add customer report functionality`. Prefer `feat:`, `fix:`, `refactor:`, `test:`, or `docs:` with a concise imperative summary. Pull requests should include a clear description, testing notes, linked issue/task when applicable, and screenshots for UI changes. Call out database migrations, auth changes, raw SQL changes, and production-risk areas explicitly.

## Security & Configuration Tips

Do not commit secrets from `.env`. Auth uses sealed cookies and `middlewares/auth.js`; protected API routes should use the auth middleware. Database access goes through Sequelize in `lib/postgres.js`, with raw SQL centralized where possible in `query/`. For upcoming multi-tenancy work, every query, write, export, and report must be scoped by `organizationId` and tested for cross-tenant isolation.
