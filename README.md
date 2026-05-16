# Royal Supremacy App

Royal Supremacy is a Vite + React command center for managing an MLBB squad:
members, fixed MVP teams, announcements, tryouts, profiles, and local admin
workflows.

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

## Supabase

The app is wired to Supabase through `@supabase/supabase-js`. The current MVP
uses one shared table, `public.mvp_app_state`, as a synced JSON state store while
the product shape is still changing quickly. Browser `localStorage` remains as a
fallback cache.

Required public Vite variables:

```bash
VITE_SUPABASE_URL="https://sjzmuegqldknoxddvzda.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
```

The current RLS policies are permissive for the private friend-demo MVP. Tighten
them before sharing the app broadly.

## Public Link

GitHub Pages deployment is configured in `.github/workflows/deploy-pages.yml`.
After the workflow runs, the share link is:

```text
https://kaizenivaro-coder.github.io/Royal-Supremacy-App/
```

## Hero Icons

MLBB hero icons live in `public/heroes`. Filenames are normalized to the same
format used by `formatHeroIconName`, for example:

- `Yi Sun-shin` -> `yi_sun_shin.png`
- `Yu Zhong` -> `yu_zhong.png`
- `X.Borg` -> `x_borg.png`

The current icon set was reused from the local asset bundle
`MLBB Default Hero Icons`.
