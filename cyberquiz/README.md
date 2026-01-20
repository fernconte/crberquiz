# CyberShield Interactive Quiz Platform

This repo is the starting scaffold for a Next.js (App Router) + Supabase build.

## Quick start

1. Install Node.js 18+ and npm.
2. Copy `.env.example` to `.env.local` and fill in Supabase keys.
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`

## Database (Postgres)

- Schema lives in `schema.sql`.
- Seed data lives in `seed.sql`.
- Apply both with `psql` or run `scripts/init-db.ps1` (expects `DATABASE_URL` or `PGHOST`/`PGUSER`/`PGDATABASE`).

## Netlify deploy

1. Connect the repo in Netlify.
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`.
3. Build command is `npm run build`, publish directory is `.next` (preconfigured in `netlify.toml`).
