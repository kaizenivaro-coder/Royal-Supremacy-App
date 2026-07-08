# Strategy Room Desktop Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add robust desktop tactical-map interactions, contextual hero controls, team outlines, duplicate placements, and a collapsible desktop shell without deleting existing Royal Supremacy data.

**Architecture:** Extend `StrategyPlacement` with optional backward-compatible tactical metadata, keep pure placement operations in `src/lib/strategy.ts`, and isolate pointer/context-menu behavior in focused Strategy Room components. The shared layout owns only desktop sidebar collapse and removal of the desktop header.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide icons, Node test runner, localStorage, Supabase-compatible app state.

---

### Task 1: Backward-Compatible Strategy Operations

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/strategy.ts`
- Test: `src/lib/strategy.test.ts`

- [ ] Add failing tests proving duplicate hero types create independent placement IDs, team colors default to `unassigned`, custom labels persist, and routes can be assigned/cleared.
- [ ] Run `node --import tsx --test src/lib/strategy.test.ts` and confirm failures describe missing operations.
- [ ] Add optional `teamColor`, `label`, and `movementRoute` placement fields plus pure `duplicateStrategyPlacement`, `updateStrategyPlacement`, and `setStrategyMovementRoute` helpers.
- [ ] Remove hero-type uniqueness rejection from `placeStrategyHero` while preserving coordinate clamping.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Hero Context Menu and Route Overlay

**Files:**
- Create: `src/components/StrategyHeroMenu.tsx`
- Create: `src/components/StrategyMovementOverlay.tsx`
- Modify: `src/pages/StrategyRoom.tsx`
- Test: `src/pages/StrategyRoom.test.ts`

- [ ] Add failing source/render tests for the menu commands, team outline choices, route replay control, and compact token sizing.
- [ ] Run the focused page test and confirm it fails before implementation.
- [ ] Render a viewport-clamped context menu on token right-click with Movement, Replay, Rename, Team Outline, Duplicate Hero, and Clear Hero commands.
- [ ] Render saved and preview movement routes as SVG lines with arrowheads over the map.
- [ ] Confirm Clear Hero before removal and use an inline rename dialog that updates only the tactical label.
- [ ] Keep duplicate heroes enabled in the deployment tray and create offset independent copies.

### Task 3: Reliable Drag and Long-Press Movement

**Files:**
- Create: `src/lib/strategyPointer.ts`
- Test: `src/lib/strategyPointer.test.ts`
- Modify: `src/pages/StrategyRoom.tsx`
- Modify: `src/index.css`

- [ ] Add failing tests for the 500ms hold threshold, drag movement threshold, and constant-speed route duration.
- [ ] Implement a pure pointer-intent classifier and duration calculator.
- [ ] Track active pointer movement at window level and commit coordinates on pointer release so fast movement cannot lose the drag.
- [ ] Activate route preview after a stationary 500ms hold, confirm on the next left click, and cancel on Escape or right click.
- [ ] Add unassigned, blue, and red token outlines plus a soft color-matched movement pulse with reduced-motion fallback.
- [ ] Animate route playback at constant speed and leave the saved route visible.

### Task 4: Desktop Shell and Regression Verification

**Files:**
- Modify: `src/components/layout.tsx`
- Modify: `src/index.css`
- Test: `src/lib/appInsights.test.ts`

- [ ] Add a desktop sidebar collapse button and persist its state under a new isolated localStorage key.
- [ ] Collapse the sidebar to an icon rail while keeping tooltips/accessible names and every navigation route functional.
- [ ] Remove the desktop top status header and its now-unused status calculations/imports; leave mobile navigation unchanged.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Browser-test desktop strategy gestures and context actions, then check dashboard, profile, teams, announcements, leaderboard, tryouts, and admin navigation.
- [ ] Browser-test the existing mobile Strategy Room drag/layout behavior and confirm no runtime errors.
