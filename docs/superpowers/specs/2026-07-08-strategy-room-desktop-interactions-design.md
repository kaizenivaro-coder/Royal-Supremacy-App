# Strategy Room Desktop Interactions Design

## Scope

Improve the existing Strategy Room without resetting or deleting any Royal Supremacy data. The update adds compact hero tokens, robust pointer dragging, saved movement routes, contextual hero controls, duplicate placements, team-color outlines, a collapsible desktop sidebar, and removal of the desktop status header.

## Strategy Tokens

- Desktop tokens use a compact 44px size.
- Every placement keeps a unique placement ID; duplicate hero types are allowed.
- Existing placements remain valid and default to an unassigned yellow outline.
- Team outline values are `unassigned`, `blue`, and `red`.
- A separate selection ring preserves the visible team outline.

## Pointer Gestures

- Moving while pressing immediately starts normal drag behavior.
- Drag tracking continues at window level, so leaving the token surface does not interrupt movement.
- Holding a stationary pointer for 500ms enters Movement mode.
- Movement mode pulses the current team-colored outline and previews a route from the hero to the pointer.
- A left click confirms the endpoint, saves the route, and animates the hero at constant speed.
- Escape or right click cancels an unfinished route.
- Reduced-motion users receive a steady highlight and immediate endpoint placement.

## Context Menu

Right click opens a menu without performing another action. Available commands are:

- Movement
- Replay Movement when a route exists
- Rename tactical label
- Team Outline: Unassigned, Blue, or Red
- Duplicate Hero
- Clear Hero, followed by confirmation

Duplicated placements are offset slightly and receive independent labels, routes, and positions.

## Persistence

Optional placement fields store tactical label, team color, and movement route. Old records require no destructive migration. Private strategy data remains account-keyed local data. Public strategy data continues through the shared Supabase-compatible state adapter.

## Desktop Layout

- The desktop sidebar collapses to an icon rail and expands through a dedicated control.
- Collapse state persists in browser localStorage.
- The desktop top status header is removed globally.
- Mobile navigation and mobile page behavior remain unchanged.

## Verification

- Unit tests cover duplicates, route persistence, labels, team colors, and placement updates.
- Existing unit tests, TypeScript checks, and production build must pass.
- Browser QA covers desktop drag speed, long hold, endpoint confirmation, replay, context menu actions, sidebar collapse, and route navigation.
- Mobile QA confirms existing touch drag and layout remain functional.
