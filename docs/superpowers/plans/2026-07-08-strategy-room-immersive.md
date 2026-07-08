# Strategy Room Immersive Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullscreen map-first Strategy Room with a collapsible hero drawer and chained movement routes while preserving existing data.

**Architecture:** Extend route data with ordered points and normalize legacy routes through pure helpers. Keep fullscreen/drawer UI in Strategy Room and route rendering in the existing overlay component. Centralize hero removal so saved and draft routes cannot outlive their owner.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Fullscreen API, Web Animations API, Node test runner.

---

### Task 1: Chained Route Data and Orphan Prevention

- [ ] Add failing tests for legacy route normalization, multi-point route creation, and excluding orphan routes.
- [ ] Extend route types and implement pure normalization/render helpers.
- [ ] Route every hero removal through one action that clears selection, context state, and active drafts.
- [ ] Run focused strategy tests.

### Task 2: Multi-Segment Overlay and Playback

- [ ] Add failing overlay tests for polyline point rendering.
- [ ] Render saved and preview chains as arrowed SVG polylines.
- [ ] Animate tokens through proportional keyframes at constant speed.
- [ ] Add desktop right-click waypoints and left-click finalization.
- [ ] Add mobile tap waypoints with Undo, Done, and Cancel.

### Task 3: Immersive Fullscreen Surface

- [ ] Replace the old toolbar/panel stack with one map stage.
- [ ] Add true fullscreen with in-app fallback and exit controls.
- [ ] Float the translucent room switch, map actions, status, and drawer handle over the map.
- [ ] Move the hero library into a collapsible right drawer.

### Task 4: Verification and Publishing

- [ ] Run all tests, TypeScript, and production build.
- [ ] Browser-test normal/fullscreen layouts, drawer states, room switching, route chains, deletion cleanup, and mobile controls.
- [ ] Commit and push the verified implementation.
