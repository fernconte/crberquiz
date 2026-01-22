# LandofCyber Interactive Quiz Platform

This repo is a Next.js (App Router) app backed by Neon Postgres.

## Quick start

1. Install Node.js 18+ and npm.
2. Create a Neon database and grab the connection string.
3. Create `.env.local` with `NEON_DATABASE_URL=...`.
4. Run the schema SQL in `scripts/schema.sql` using the Neon SQL editor or `psql`.
5. Seed admin + categories:
   - Set `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` in your shell.
   - Run `npm run db:seed`
6. Install dependencies: `npm install`
7. Run dev server: `npm run dev`

## Admin access

Use the admin user you seed via `npm run db:seed` and visit `/dashboard`.

## Netlify deploy

1. Connect the repo in Netlify.
2. Build command is `npm run build`, publish directory is `.next` (preconfigured in `netlify.toml`).
3. Set `NEON_DATABASE_URL` in Netlify environment variables.
