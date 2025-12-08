# Vehicle Management App

A simple fleet dashboard with auth, vehicle CRUD, mock telemetry sender, and a web UI for monitoring vehicle health.

## Tech Stack
- Next.js 16 (App Router) • TypeScript • TailwindCSS
- Shadcn UI components
- Neon/Postgres via `@neondatabase/serverless`

## Setup
1) Install deps: `npm install` (or `pnpm install` / `bun install`)
2) Env: create `.env.local`
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
```
3) DB schema: run the SQL in `scripts/001-create-tables.sql` and `scripts/002-add-telemetry-fields.sql` on your database.
4) Dev server: `npm run dev` (or `pnpm dev` / `bun dev`)

## Usage
- Sign up / log in, then add vehicles (VIN + registration + model).
- Copy the vehicle code and send telemetry from the mock sender at `/mock-vehicle` (admin creds in code).
- Dashboard updates with latest health and telemetry details for each vehicle.

## Sample Data (passes validation)
- VINs: `MA3EYD32S00123456`, `MALBB51RLDM789012`, `MAT448154H1234567`
- Registration numbers: `MH12AB1234`, `DL03CD5678`, `KA05EF9012`, `TN10GH3456`

## Notes
- Only `DATABASE_URL` is required to run locally.
- Mock telemetry payloads should include the vehicle `code`; see `/api/telemetry` for fields.

