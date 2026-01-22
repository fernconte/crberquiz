# LandofCyber Interactive Quiz Platform

This repo is a Next.js (App Router) scaffold that runs on local JSON data.

## Quick start

1. Install Node.js 18+ and npm.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## Data (JSON)

- Content lives in `data/store.json`.
- Edit that file to add categories, quizzes, questions, and leaderboard entries.
- Admin user: `f3rncont4` (password set in the seed data).
- User submissions are written to `data/store.json` during local dev.

## Netlify deploy

1. Connect the repo in Netlify.
2. Build command is `npm run build`, publish directory is `.next` (preconfigured in `netlify.toml`).
3. Netlify deploys are read-only at runtime, so JSON submissions will not persist unless you add a database later.
