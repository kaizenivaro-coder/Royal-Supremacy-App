# Royal Supremacy App

Royal Supremacy is a Vite + React command center for managing an MLBB squad:
members, fixed MVP teams, announcements, profiles, and local admin
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
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_your_publishable_key"
```

The current RLS policies are permissive for the private friend-demo MVP. Tighten
them before sharing the app broadly.

### GitHub Pages Supabase Setup

GitHub Pages builds use the public Supabase project URL and publishable key in
`.github/workflows/deploy-pages.yml`. These values are client-side public values;
never put a Supabase service role key or direct database password in the frontend
or GitHub Actions build environment.

If the Supabase publishable key is rotated later, update the workflow value and
redeploy. A stricter production setup can move these values back into GitHub
repository variables/secrets.

The free-tier keepalive workflow in `.github/workflows/supabase-keepalive.yml`
runs every Monday and Thursday at 06:00 UTC, and can also be run manually from
GitHub Actions. It pings the `public.mvp_app_state` REST endpoint so Supabase
sees real database API activity.

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
