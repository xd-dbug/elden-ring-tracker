# Elden Ring Progress Tracker

A mobile-friendly web app for tracking an Elden Ring playthrough: pick an ending, see the bosses it
requires, add any extra bosses, and check them off. Progress is saved in `localStorage`.

Built with React + Vite and deployed to GitHub Pages. See [docs/PLAN.md](docs/PLAN.md) for the full plan.

## Getting started

```sh
npm install
npm run dev        # http://localhost:5173/elden-ring-tracker/
```

## Scripts

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                      |
| `npm run build`     | Build static files into `dist/`                           |
| `npm run preview`   | Serve the production build locally                        |
| `npm test`          | Run Vitest once (`npm run test:watch` to watch)           |
| `npm run lint`      | ESLint                                                    |
| `npm run format`    | Prettier                                                  |
| `npm run sync-data` | Refresh `src/data/bosses.snapshot.json` from the boss API |

## Project layout

```
src/
  api/bosses.js          fetch + cache, falls back to the snapshot
  data/endings.json      curated ending -> required bosses (DRAFT, verify against a wiki)
  data/bosses.snapshot.json
  lib/                   pure helpers: slug, normalize, storage, progress
  state/TrackerContext.jsx
  hooks/useBosses.js
  components/  pages/
tests/                   Vitest
scripts/sync-data.js
```

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml` (test -> build -> GitHub Pages).
One-time setup: repo **Settings -> Pages -> Source: GitHub Actions**. The `base` in
`vite.config.js` must match the repo name.
