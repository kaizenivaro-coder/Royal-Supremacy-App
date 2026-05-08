# Royal Supremacy App

Royal Supremacy is a Vite + React command center for managing an MLBB squad:
members, teams, schedules, battle reports, Royal Points, leaderboards,
announcements, tryouts, and local admin workflows.

## Run Locally

Prerequisite: Node.js

```bash
npm install
npm run dev
```

The dev server defaults to `http://127.0.0.1:3000`.

## Quality Checks

```bash
npm test
npm run lint
npm run build
```

## Current Data Layer

The app currently stores data in browser `localStorage` through
`src/data/store.tsx`. Supabase is not wired yet: there is no
`@supabase/supabase-js` dependency and no `VITE_SUPABASE_*` environment
configuration.

Planned Supabase work:

- Add Supabase client configuration through public Vite environment variables.
- Design tables for members, teams, schedules, matches, points, announcements,
  and tryouts.
- Add Row Level Security policies before exposing write access.
- Replace local-only mutations with Supabase-backed reads and writes.

## Hero Icons

MLBB hero icons live in `public/heroes`. Filenames are normalized to the same
format used by `formatHeroIconName`, for example:

- `Yi Sun-shin` -> `yi_sun_shin.png`
- `Yu Zhong` -> `yu_zhong.png`
- `X.Borg` -> `x_borg.png`

The current icon set was reused from the local asset bundle
`MLBB Default Hero Icons`.
