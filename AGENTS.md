# Repository Guidelines

## Project Purpose

This repository is for the LUXAS reservation and customer management system v0.1 prototype. The first delivery target is a one-week internal prototype for a single store, built with Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL, Supabase Auth, and Vercel.

Do not start implementation unless the user explicitly asks for code. Current planning documents live in `docs/`.

## Product Boundaries

Use business requirements such as reservation ledger, staff time grid, customer search, customer chart, shifts, and booth management as references. Do not copy PeakManager UI, CSS, images, icons, layout details, or wording.

The v0.1 prototype excludes online booking, LINE integration, payments, points, prepaid tickets, email campaigns, sales analytics, and multi-store operations.

## Intended Project Structure

When implementation begins, prefer this structure:

- `app/` for Next.js App Router routes and layouts.
- `components/` for reusable UI components.
- `features/` for domain modules such as `reservations`, `customers`, `staff`, `shifts`, and `booths`.
- `lib/` for Supabase clients, date utilities, validation, and shared helpers.
- `supabase/migrations/` for schema migrations and seed data.
- `tests/` for unit, integration, and browser workflow tests.
- `docs/` for scope, schema, screen, and test planning documents.

## Development Commands

No package files exist yet. After setup, define and maintain these commands:

- `npm run dev` starts the local Next.js app.
- `npm run lint` runs TypeScript and style checks.
- `npm test` runs automated tests.
- `npm run build` verifies production build readiness.

Do not rely on undocumented global tools.

## Coding Style

Use TypeScript with explicit domain types and conservative validation at data boundaries. Prefer 2-space indentation for TypeScript, JSON, YAML, and Markdown. Use Tailwind utility classes with small reusable components when patterns repeat.

Name files by feature and purpose, for example `reservation-grid.tsx`, `customer-search.tsx`, and `shift-editor.tsx`. Use original Japanese UI text tailored to LUXAS operations.

## Testing Expectations

Add tests for reservation creation/editing, overlapping time detection, customer search, chart updates, shift display, booth availability, and auth-guarded routes. Prefer focused tests near changed behavior and add browser checks for core workflows.

## Security & Configuration

Never commit secrets, production customer data, or Supabase service-role keys. Keep local variables in `.env.local` and document required keys in `.env.example` once implementation starts. Use Supabase Row Level Security policies for authenticated staff access.
