# Strategy Room Immersive Map Design

## Goal

Turn Strategy Room into a map-first tactical surface with true browser fullscreen, translucent edge controls, a collapsible right hero drawer, and chained movement routes on desktop and mobile.

## Map Surface

- Normal mode is a large immersive map without the old toolbar or separate room description panel.
- Fullscreen uses the browser Fullscreen API and falls back to a fixed in-app immersive mode when unavailable.
- The existing Private/Public segmented control floats at the top center with translucent styling.
- Fullscreen, clear-map, and remove-selected controls are compact icon buttons placed along the far left edge.
- Autosave remains active; no Save or Reset View buttons are shown.
- Status feedback floats near the bottom edge.

## Hero Drawer

- The hero library is a right-side translucent drawer inside the map surface.
- A persistent edge handle expands and contracts it.
- Expanded state prioritizes hero selection and may cover part of the map.
- Search, hero selection, and admin editor controls remain available.

## Chained Movement

- Movement routes store an ordered list of percentage-based points.
- Legacy two-point routes are read as two-point chains without destructive migration.
- Desktop: long press or context-menu Movement starts a route; right click adds intermediate waypoints; left click sets the final endpoint and plays the route.
- Mobile: long press starts a route; taps add waypoints; floating Undo, Done, and Cancel controls manage the draft.
- Route playback uses constant speed across every segment and remains replayable.

## Route Ownership

- Routes belong exclusively to their hero placement.
- Removing a hero clears its active draft and saved route through one shared removal action.
- The overlay filters out any route or draft without an existing owner.

## Safety

- Existing private/public strategies and legacy route data remain valid.
- No localStorage reset or destructive migration is used.
