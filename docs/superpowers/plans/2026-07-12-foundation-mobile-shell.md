# Royal Supremacy Foundation And Mobile Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish truthful product metrics, retire Tryouts completely, add reusable overlay/feedback foundations, and replace the mobile drawer-first shell with a premium bottom-navigation experience.

**Architecture:** Domain selectors calculate account and roster truth independently from React. Navigation metadata becomes a single shared configuration consumed by desktop sidebar, mobile bottom navigation, and the More sheet. Reusable overlay and feedback components standardize focus, scroll locking, motion, and status feedback before the remaining routes are redesigned.

**Tech Stack:** React 19, React Router 7, TypeScript 5.8, Tailwind CSS 4, Motion, Lucide React, Node test runner with `tsx`.

---

## Scope Boundary

This plan is the first independently deployable program from the approved product redesign. It does not redesign Profile, Teams, Leaderboard, Decrees, Admin forms, or Strategy interactions. Those receive separate plans after this foundation is integrated so every program remains reviewable and reversible.

## File Map

**Create**

- `src/lib/productMetrics.ts`: pure account and roster count selectors.
- `src/lib/productMetrics.test.ts`: product-truth tests.
- `src/config/navigation.ts`: shared route metadata and visibility rules.
- `src/config/navigation.test.ts`: mobile, desktop, and admin navigation tests.
- `src/components/overlays.tsx`: focused dialog, mobile sheet, scroll lock, and focus restoration.
- `src/components/overlays.test.ts`: semantic overlay rendering tests.
- `src/components/feedback.tsx`: toast region, status banner, and empty state.
- `src/components/feedback.test.ts`: feedback semantics tests.

**Modify**

- `src/types.ts`: remove the retired `Tryout` domain type.
- `src/data/mock.ts`: remove tryout seed records and stale MVP copy.
- `src/data/store.tsx`: remove Tryouts state/persistence and expose approved account count.
- `src/data/store.test.ts`: verify account reset and account-count behavior.
- `src/lib/supabaseAppState.ts`: remove Tryouts from remote state compatibility.
- `src/lib/supabaseAppState.test.ts`: update normalized-state expectations.
- `src/lib/mvpApp.ts`: advance the migration version and retire the Tryouts storage key.
- `src/App.tsx`: replace retired routes with a single intentional unavailable route.
- `src/components/layout.tsx`: consume navigation config and implement mobile shell.
- `src/components/layout.test.ts`: verify mobile bottom navigation and admin visibility.
- `src/components/ui.tsx`: export shared page and surface primitives.
- `src/pages/Dashboard.tsx`: label approved accounts and active roster members truthfully; remove MVP language.
- `src/pages/Dashboard.test.ts`: verify truthful labels and no retired language.
- `src/pages/Admin.tsx`: remove Tryouts reset copy and use truthful account/roster labels.
- `src/pages/Admin.test.ts`: verify current-scope labels.
- `src/pages/MobilePreview.tsx`: turn the page into a neutral responsive preview utility without product claims.
- `src/index.css`: safe-area, reduced-motion, focus-ring, and shell tokens.

**Delete**

- `src/pages/Tryouts.tsx`: retired route implementation.

### Task 1: Product-Truth Selectors

**Files:**
- Create: `src/lib/productMetrics.ts`
- Create: `src/lib/productMetrics.test.ts`
- Modify: `src/data/store.tsx`

- [ ] **Step 1: Write the failing selector tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getProductMetrics } from "./productMetrics.ts";

test("approved accounts and active roster members are counted separately", () => {
  const metrics = getProductMetrics({
    accounts: [{ id: "auth_kingchoou" }],
    members: [
      { id: "king", status: "Active", authUserId: "auth_kingchoou" },
      { id: "void", status: "Active" },
      { id: "former", status: "Archived" },
    ],
    pendingAccountRequests: [{ id: "request_1" }],
  });

  assert.deepEqual(metrics, {
    approvedAccountCount: 1,
    activeRosterCount: 2,
    archivedRosterCount: 1,
    pendingAccountCount: 1,
  });
});
```

- [ ] **Step 2: Run the selector test and verify RED**

Run: `node --import tsx --test src/lib/productMetrics.test.ts`

Expected: FAIL because `productMetrics.ts` does not exist.

- [ ] **Step 3: Implement the pure selector**

```ts
type ProductMetricsInput = {
  accounts: { id: string }[];
  members: { id: string; status: string; authUserId?: string }[];
  pendingAccountRequests: { id: string }[];
};

export function getProductMetrics(input: ProductMetricsInput) {
  return {
    approvedAccountCount: input.accounts.length,
    activeRosterCount: input.members.filter((member) => member.status === "Active").length,
    archivedRosterCount: input.members.filter((member) => member.status === "Archived").length,
    pendingAccountCount: input.pendingAccountRequests.length,
  };
}
```

In `src/data/store.tsx`, add `approvedAccountCount: number` to `AppState`, initialize it from `authAccounts.length`, and provide `approvedAccountCount={authAccounts.length}` through the context value. Do not persist this derived number.

- [ ] **Step 4: Run focused and full tests**

Run: `node --import tsx --test src/lib/productMetrics.test.ts`

Expected: PASS.

Run: `npm test`

Expected: existing suite remains green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/productMetrics.ts src/lib/productMetrics.test.ts src/data/store.tsx
git commit -m "feat: separate account and roster metrics"
```

### Task 2: Retire Tryouts From The Active Product

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/mock.ts`
- Modify: `src/data/store.tsx`
- Modify: `src/lib/supabaseAppState.ts`
- Modify: `src/lib/supabaseAppState.test.ts`
- Modify: `src/lib/mvpApp.ts`
- Modify: `src/App.tsx`
- Delete: `src/pages/Tryouts.tsx`

- [ ] **Step 1: Write migration and remote-state failing tests**

Add to `src/lib/supabaseAppState.test.ts`:

```ts
test("normalized remote state ignores retired tryout records", () => {
  const normalized = normalizeRemoteAppState({
    members: [],
    tryouts: [{ id: "retired" }],
  });

  assert.ok(normalized);
  assert.equal("tryouts" in normalized, false);
});
```

Add to `src/data/store.test.ts`:

```ts
test("Tryouts is a retired local storage domain", () => {
  assert.ok(RETIRED_STORAGE_KEYS.includes("tryouts"));
});
```

Export the storage-key constant as `RETIRED_STORAGE_KEYS` from `src/data/store.tsx` for this migration assertion.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --import tsx --test src/lib/supabaseAppState.test.ts src/data/store.test.ts`

Expected: FAIL because normalized state still contains Tryouts and the exported retired key is absent.

- [ ] **Step 3: Remove the retired domain**

Make these exact structural changes:

```ts
// src/data/store.tsx
export const RETIRED_STORAGE_KEYS = ["schedule", "matches", "points", "tryouts"];
```

- Remove the `Tryout` import and interface from `src/types.ts`.
- Remove `mockTryouts` from `src/data/mock.ts`.
- Remove `tryouts`, `setTryouts`, `setTryoutsState`, hydration, persistence, reset, and provider fields from `src/data/store.tsx`.
- Remove `tryouts` from `RemoteAppState`, normalization, reconciliation, and save snapshots in `src/lib/supabaseAppState.ts`.
- Change `MVP_STORAGE_VERSION` to `royal-supremacy-mobile-foundation-2026-07-12` in `src/lib/mvpApp.ts` so migration runs once.
- Delete `src/pages/Tryouts.tsx`.
- Keep `/tryouts` in `src/App.tsx` only as an old-link compatibility route rendering `PausedFeature` with `featureName="This section has been retired"`.

- [ ] **Step 4: Remove stale visible copy and run verification**

Run: `rg -n "Tryouts|tryouts" src --glob '!**/*.test.ts'`

Expected: only the compatibility route and retired storage key remain.

Run: `npm test && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/data/mock.ts src/data/store.tsx src/data/store.test.ts src/lib/supabaseAppState.ts src/lib/supabaseAppState.test.ts src/lib/mvpApp.ts src/App.tsx src/pages/Tryouts.tsx
git commit -m "refactor: retire tryouts from active state"
```

### Task 3: Shared Navigation Configuration

**Files:**
- Create: `src/config/navigation.ts`
- Create: `src/config/navigation.test.ts`
- Modify: `src/components/layout.tsx`

- [ ] **Step 1: Write failing navigation tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getDesktopNavigation, getMobilePrimaryNavigation, getMoreNavigation } from "./navigation.ts";

test("mobile primary navigation contains exactly five member destinations", () => {
  assert.deepEqual(
    getMobilePrimaryNavigation(false).map((item) => item.path),
    ["/", "/teams", "/strategy", "/announcements", "/profile"],
  );
});

test("Admin Portal appears only for administrators", () => {
  assert.equal(getMoreNavigation(false).some((item) => item.path === "/admin"), false);
  assert.equal(getMoreNavigation(true).some((item) => item.path === "/admin"), true);
  assert.equal(getDesktopNavigation(false).some((item) => item.path === "/admin"), false);
});
```

- [ ] **Step 2: Run the navigation test and verify RED**

Run: `node --import tsx --test src/config/navigation.test.ts`

Expected: FAIL because the shared config does not exist.

- [ ] **Step 3: Implement route metadata and selectors**

```ts
import { Bell, FileEdit, Home, MapPinned, Megaphone, Shield, Trophy, UserCircle } from "lucide-react";

export type NavigationItem = {
  name: string;
  path: string;
  icon: typeof Home;
  adminOnly?: boolean;
};

const primaryMobile: NavigationItem[] = [
  { name: "Home", path: "/", icon: Home },
  { name: "Teams", path: "/teams", icon: Shield },
  { name: "Strategy", path: "/strategy", icon: MapPinned },
  { name: "Decrees", path: "/announcements", icon: Megaphone },
  { name: "Profile", path: "/profile", icon: UserCircle },
];

const moreItems: NavigationItem[] = [
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Admin Portal", path: "/admin", icon: FileEdit, adminOnly: true },
];

const filterForAccess = (items: NavigationItem[], isAdmin: boolean) =>
  items.filter((item) => !item.adminOnly || isAdmin);

export const getMobilePrimaryNavigation = (_isAdmin: boolean) => primaryMobile;
export const getMoreNavigation = (isAdmin: boolean) => filterForAccess(moreItems, isAdmin);
export const getDesktopNavigation = (isAdmin: boolean) =>
  filterForAccess([...primaryMobile.slice(0, 2), moreItems[0], primaryMobile[2], primaryMobile[3], primaryMobile[4], moreItems[2]], isAdmin);
```

Add `/notifications` as a compatibility destination rendering the shared empty state until the notification inbox plan is implemented. Do not add it to primary mobile navigation.

- [ ] **Step 4: Replace the local `navItems` constant and verify**

Update `src/components/layout.tsx` to call `getDesktopNavigation(isAdmin)` and remove duplicated route metadata and icon imports.

Run: `node --import tsx --test src/config/navigation.test.ts src/components/layout.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/navigation.ts src/config/navigation.test.ts src/components/layout.tsx src/components/layout.test.ts src/App.tsx
git commit -m "refactor: centralize application navigation"
```

### Task 4: Accessible Overlay And Feedback Primitives

**Files:**
- Create: `src/components/overlays.tsx`
- Create: `src/components/overlays.test.ts`
- Create: `src/components/feedback.tsx`
- Create: `src/components/feedback.test.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing semantic component tests**

```ts
test("FocusedDialog renders modal semantics and a named close control", () => {
  const html = renderToStaticMarkup(
    <FocusedDialog open title="Edit profile" onClose={() => undefined}>
      Content
    </FocusedDialog>,
  );
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Close Edit profile"/);
});

test("StatusBanner exposes live status semantics", () => {
  const html = renderToStaticMarkup(<StatusBanner tone="success">Saved</StatusBanner>);
  assert.match(html, /role="status"/);
  assert.match(html, /Saved/);
});
```

- [ ] **Step 2: Run component tests and verify RED**

Run: `node --import tsx --test src/components/overlays.test.ts src/components/feedback.test.ts`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement focused components**

`FocusedDialog` must:

- Render nothing when `open` is false.
- Capture the previously focused element.
- Lock `document.body.style.overflow` while open and restore it on cleanup.
- Close on Escape.
- Move initial focus to the close button.
- Restore focus after close.
- Render a blurred backdrop, 8px-radius surface, top-left back arrow, scrollable content, and optional sticky footer.

`MobileSheet` shares the same state behavior but anchors to the bottom below `768px` and becomes a centered dialog above it.

`StatusBanner`, `EmptyState`, and `ToastRegion` must use semantic live-region roles and accept icon components from Lucide rather than handcrafted assets.

- [ ] **Step 4: Add global interaction tokens and verify**

Append to `src/index.css`:

```css
:root {
  --mobile-bottom-nav-height: 72px;
  --focus-ring: 0 0 0 3px rgb(75 174 255 / 0.42);
}

:focus-visible {
  outline: 2px solid #60b8ff;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Run: `npm test && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/overlays.tsx src/components/overlays.test.ts src/components/feedback.tsx src/components/feedback.test.ts src/index.css
git commit -m "feat: add accessible overlay and feedback primitives"
```

### Task 5: Mobile Bottom Navigation And More Sheet

**Files:**
- Modify: `src/components/layout.tsx`
- Modify: `src/components/layout.test.ts`
- Modify: `src/components/overlays.tsx`

- [ ] **Step 1: Write failing shell tests**

Add server-rendered assertions to `src/components/layout.test.ts`:

```ts
assert.match(html, /aria-label="Primary navigation"/);
assert.match(html, />Home</);
assert.match(html, />Strategy</);
assert.match(html, />Decrees</);
assert.match(html, /aria-label="Open more navigation"/);
assert.doesNotMatch(nonAdminHtml, />Admin Portal</);
```

- [ ] **Step 2: Run shell tests and verify RED**

Run: `node --import tsx --test src/components/layout.test.ts`

Expected: FAIL because mobile still uses the full-height drawer.

- [ ] **Step 3: Implement the mobile shell**

Replace the mobile drawer-first layout with:

```tsx
<header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-white/10 bg-background/92 backdrop-blur-xl lg:hidden">
  {/* logo, contextual title, notification icon, More button */}
</header>

<nav
  aria-label="Primary navigation"
  className="fixed inset-x-0 bottom-0 z-50 grid h-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom))] grid-cols-5 border-t border-white/10 bg-[#06111f]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
>
  {/* five stable icon + label links from getMobilePrimaryNavigation */}
</nav>
```

Each item uses a 44px minimum hit target, stable icon dimensions, a visible label, and a selected state indicated by icon, text, and a small gold marker. Do not use a floating pill around every item.

The More button opens `MobileSheet` containing Leaderboard, Notifications, Admin Portal when authorized, and Sign Out. Remove the old mobile sidebar and backdrop entirely.

Main content receives `pt-14 pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom)+16px)]` on mobile and preserves desktop sidebar padding.

- [ ] **Step 4: Verify navigation behavior**

Run: `node --import tsx --test src/config/navigation.test.ts src/components/layout.test.ts`

Expected: PASS.

Browser checks in the in-app browser:

- Every mobile destination is one tap away.
- More sheet locks background scroll and restores focus.
- Strategy can hide the shell only while immersive.
- Admin Portal is absent for non-admin context.
- Labels do not clip at 320px width.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout.tsx src/components/layout.test.ts src/components/overlays.tsx
git commit -m "feat: add mobile-first application navigation"
```

### Task 6: Truthful Dashboard And Admin Overview Copy

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Dashboard.test.ts`
- Modify: `src/pages/Admin.tsx`
- Modify: `src/pages/Admin.test.ts`
- Modify: `src/pages/MobilePreview.tsx`

- [ ] **Step 1: Write failing copy and metric tests**

Update `src/pages/Dashboard.test.ts` to expect:

```ts
assert.deepEqual(cards.map((card) => card.label), ["Current RP", "Mythic Stars", "Squad Members"]);
assert.doesNotMatch(html, /MVP/i);
assert.doesNotMatch(html, /first usable squad build/i);
```

Add to `src/pages/Admin.test.ts`:

```ts
assert.match(html, /Approved Accounts/);
assert.match(html, /Active Roster/);
assert.doesNotMatch(html, /tryouts/i);
assert.doesNotMatch(html, /MVP Data Core/i);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --import tsx --test src/pages/Dashboard.test.ts src/pages/Admin.test.ts`

Expected: FAIL on existing labels and stale MVP copy.

- [ ] **Step 3: Implement truthful metrics**

Dashboard uses `activeRosterCount` for `Squad Members` and never implies those members have accounts. Admin Overview displays separate cards:

```tsx
<Metric label="Approved Accounts" value={approvedAccountCount} />
<Metric label="Active Roster" value={activeRosterCount} />
<Metric label="Pending Requests" value={pendingAccountRequests.length} />
<Metric label="Teams" value={activeTeams.length} />
```

Replace visible `MVP` phrases with product-language copy:

- `MVP Command Center` -> `Squad Command`
- `first usable squad build` -> a current squad-status sentence
- `MVP Data Core` -> `Local Data`
- Reset copy lists only domains still reset by the function.

Mobile Preview becomes a development utility titled `Responsive Preview`; remove language suggesting it is part of the squad app.

- [ ] **Step 4: Run verification**

Run: `rg -n "MVP|Tryouts|tryouts" src/pages/Dashboard.tsx src/pages/Admin.tsx src/pages/MobilePreview.tsx`

Expected: no matches.

Run: `npm test && npm run lint && npm run build`

Expected: PASS; only the existing Vite chunk-size advisory may remain.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Dashboard.test.ts src/pages/Admin.tsx src/pages/Admin.test.ts src/pages/MobilePreview.tsx
git commit -m "fix: make squad metrics and copy truthful"
```

### Task 7: Local Browser QA And Regression Gate

**Files:**
- Modify only files required by defects found during this task.
- Save evidence under: `output/foundation-shell-qa/`

- [ ] **Step 1: Run the complete automated gate**

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: no TypeScript errors.

Run: `npm run build`

Expected: production build succeeds.

- [ ] **Step 2: Verify desktop routes in the in-app browser**

Check `/`, `/profile`, `/teams`, `/leaderboard`, `/announcements`, `/admin`, and `/strategy`.

Expected:

- Fixed desktop sidebar remains stable while content scrolls.
- Admin item appears for KingChoou.
- No route exposes Tryouts or stale MVP copy.
- Existing route behavior remains intact.

- [ ] **Step 3: Verify the phone preview**

Use `/mobile-preview` and test Home, Teams, Strategy, Decrees, Profile, and More.

Expected:

- Five bottom destinations remain readable.
- No horizontal overflow.
- More opens as a focused sheet.
- Background cannot scroll behind the sheet.
- Sign out remains available but is separated from ordinary navigation.

- [ ] **Step 4: Inspect console and save screenshots**

Save accepted screenshots:

- `output/foundation-shell-qa/home-mobile.png`
- `output/foundation-shell-qa/more-sheet-mobile.png`
- `output/foundation-shell-qa/home-desktop.png`
- `output/foundation-shell-qa/admin-overview-desktop.png`

Expected: no uncaught runtime errors and no missing asset errors.

- [ ] **Step 5: Commit QA fixes**

```bash
git add src
git commit -m "fix: resolve foundation shell QA findings"
```

If no source defects are found, do not create an empty commit.

## Completion Criteria

- KingChoou remains the sole seeded approved account and receives admin access after login.
- Approved account and active roster counts are distinct throughout the app.
- Tryouts is absent from active state, navigation, copy, resets, remote snapshots, and source pages.
- Mobile uses a five-item bottom navigation and More sheet.
- Desktop sidebar remains fixed and collapsible.
- Shared overlays lock scroll, restore focus, and support Escape/reduced motion.
- Automated tests, TypeScript validation, production build, and browser QA pass.
- No live deployment occurs.
