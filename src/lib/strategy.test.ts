import assert from "node:assert/strict";
import test from "node:test";
import {
  canEditPublicStrategy,
  canManageStrategyEditors,
  clearStrategyMovementRoute,
  createDefaultStrategyMotionPath,
  createKeyframeTransitionRoute,
  createStrategyKeyframe,
  duplicateStrategyPlacement,
  createStrategyMovementRoute,
  getRenderableStrategyRoutes,
  getStrategyRoutePoints,
  moveStrategyPlacement,
  placeStrategyHero,
  removeStrategyPlacement,
  removeStrategyKeyframe,
  removeStrategyMotionPath,
  normalizeStrategySpeed,
  shouldOpenStrategyDrawerByDefault,
  shouldUseImmersiveStrategyLayout,
  updateStrategyPlacement,
  upsertStrategyMotionPath,
  upsertStrategyKeyframeSnapshot,
  toggleStrategyEditor,
} from "./strategy.ts";

test("public strategy editing is limited to admins and assigned editors", () => {
  assert.equal(canEditPublicStrategy(true, "kingchoou", []), true);
  assert.equal(canEditPublicStrategy(false, "omen", ["omen"]), true);
  assert.equal(canEditPublicStrategy(false, "omen", ["kingvoid"]), false);
});

test("strategy editor controls are only available to admins in public rooms", () => {
  assert.equal(canManageStrategyEditors(true, "public"), true);
  assert.equal(canManageStrategyEditors(true, "private"), false);
  assert.equal(canManageStrategyEditors(false, "public"), false);
});

test("strategy room uses immersive map layout on phone-sized screens", () => {
  assert.equal(shouldUseImmersiveStrategyLayout(390), true);
  assert.equal(shouldUseImmersiveStrategyLayout(767), true);
  assert.equal(shouldUseImmersiveStrategyLayout(844, 390), true);
  assert.equal(shouldUseImmersiveStrategyLayout(768), false);
  assert.equal(shouldUseImmersiveStrategyLayout(1280), false);
  assert.equal(shouldUseImmersiveStrategyLayout(1280, 500), false);
});

test("strategy drawer starts closed for immersive phone layouts", () => {
  assert.equal(shouldOpenStrategyDrawerByDefault(844, 390), false);
  assert.equal(shouldOpenStrategyDrawerByDefault(390, 844), false);
  assert.equal(shouldOpenStrategyDrawerByDefault(1280, 720), true);
});

test("placing duplicate hero types creates independent unassigned placements", () => {
  const first = placeStrategyHero([], {
    heroId: "chou",
    heroName: "Chou",
    xPercent: -12,
    yPercent: 118,
    actorUsername: "kingchoou",
    now: "2026-07-08T12:00:00.000Z",
  });

  assert.equal(first.placements.length, 1);
  assert.equal(first.placements[0]?.xPercent, 0);
  assert.equal(first.placements[0]?.yPercent, 100);

  const duplicate = placeStrategyHero(first.placements, {
    heroId: "chou",
    heroName: "Chou",
    xPercent: 50,
    yPercent: 50,
    actorUsername: "kingchoou",
  });
  assert.equal(duplicate.placements.length, 2);
  assert.notEqual(duplicate.placements[0]?.id, duplicate.placements[1]?.id);
  assert.equal(duplicate.placements[1]?.teamColor, "unassigned");
});

test("placements support labels, team outlines, movement routes, and duplication", () => {
  const placed = placeStrategyHero([], {
    heroId: "chou",
    heroName: "Chou",
    xPercent: 40,
    yPercent: 50,
    actorUsername: "kingchoou",
    now: "2026-07-08T12:00:00.000Z",
  }).placements[0]!;
  const updated = updateStrategyPlacement([placed], placed.id, {
    label: "Roamer",
    teamColor: "blue",
    movementRoute: { startXPercent: 40, startYPercent: 50, endXPercent: 75, endYPercent: 30 },
  })[0]!;
  const duplicated = duplicateStrategyPlacement([updated], updated.id, "kingchoou");

  assert.equal(updated.label, "Roamer");
  assert.equal(updated.teamColor, "blue");
  assert.equal(updated.movementRoute?.endXPercent, 75);
  assert.equal(duplicated.length, 2);
  assert.notEqual(duplicated[1]?.id, updated.id);
  assert.equal(duplicated[1]?.xPercent, 43);
  assert.equal(duplicated[1]?.movementRoute, undefined);
});

test("clearStrategyMovementRoute removes only the line from a hero placement", () => {
  const placed = placeStrategyHero([], {
    heroId: "chou",
    heroName: "Chou",
    xPercent: 40,
    yPercent: 50,
    actorUsername: "kingchoou",
    now: "2026-07-10T12:00:00.000Z",
  }).placements[0]!;
  const route = createStrategyMovementRoute([
    { xPercent: 40, yPercent: 50 },
    { xPercent: 60, yPercent: 70 },
  ]);
  const withRoute = updateStrategyPlacement([placed], placed.id, {
    movementRoute: route,
  });

  const cleared = clearStrategyMovementRoute(withRoute, placed.id);

  assert.equal(cleared.length, 1);
  assert.equal(cleared[0]?.id, placed.id);
  assert.equal(cleared[0]?.heroName, "Chou");
  assert.equal(cleared[0]?.xPercent, 40);
  assert.equal(cleared[0]?.movementRoute, undefined);
});

test("strategy speed normalizes to supported playback values", () => {
  assert.equal(normalizeStrategySpeed(0.5), 0.5);
  assert.equal(normalizeStrategySpeed(1.5), 1.5);
  assert.equal(normalizeStrategySpeed(3), 3);
  assert.equal(normalizeStrategySpeed(9), 1);
  assert.equal(normalizeStrategySpeed(Number.NaN), 1);
});

test("strategy keyframes snapshot board state and protect the last frame", () => {
  const placed = placeStrategyHero([], {
    heroId: "alice",
    heroName: "Alice",
    xPercent: 25,
    yPercent: 45,
    actorUsername: "kingchoou",
    now: "2026-07-10T12:00:00.000Z",
  }).placements;
  const keyframe = createStrategyKeyframe(placed, 0, {
    id: "kf_1",
    now: "2026-07-10T12:00:00.000Z",
  });
  const updatedPlacements = moveStrategyPlacement(placed, placed[0]!.id, 70, 25, "kingchoou");
  const updatedFrames = upsertStrategyKeyframeSnapshot([keyframe], "kf_1", updatedPlacements);
  const removeLast = removeStrategyKeyframe(updatedFrames, "kf_1");

  assert.equal(keyframe.label, "Keyframe 1");
  assert.equal(updatedFrames[0]?.placements[0]?.xPercent, 70);
  assert.equal(placed[0]?.xPercent, 25);
  assert.equal(removeLast.keyframes.length, 1);
  assert.equal(removeLast.activeKeyframeId, "kf_1");
});

test("keyframe transition route uses explicit motion paths instead of hero movement routes", () => {
  const from = placeStrategyHero([], {
    heroId: "chou",
    heroName: "Chou",
    xPercent: 20,
    yPercent: 30,
    actorUsername: "kingchoou",
  }).placements[0]!;
  const route = createStrategyMovementRoute([
    { xPercent: 20, yPercent: 30 },
    { xPercent: 40, yPercent: 28 },
    { xPercent: 75, yPercent: 18 },
  ]);
  const to = {
    ...from,
    xPercent: 75,
    yPercent: 18,
    movementRoute: route,
  };
  const motionPath = createDefaultStrategyMotionPath({
    fromKeyframeId: "kf_1",
    toKeyframeId: "kf_2",
    placementId: from.id,
    from,
    to,
    points: [
      { xPercent: 20, yPercent: 30 },
      { xPercent: 44, yPercent: 36 },
      { xPercent: 75, yPercent: 18 },
    ],
    now: "2026-07-10T12:00:00.000Z",
  });

  assert.deepEqual(getStrategyRoutePoints(createKeyframeTransitionRoute(from, to, motionPath)), [
    { xPercent: 20, yPercent: 30 },
    { xPercent: 44, yPercent: 36 },
    { xPercent: 75, yPercent: 18 },
  ]);

  assert.deepEqual(getStrategyRoutePoints(createKeyframeTransitionRoute(from, to)), [
    { xPercent: 20, yPercent: 30 },
    { xPercent: 75, yPercent: 18 },
  ]);
});

test("motion paths upsert and remove by keyframe pair and placement", () => {
  const from = placeStrategyHero([], {
    heroId: "alice",
    heroName: "Alice",
    xPercent: 30,
    yPercent: 55,
    actorUsername: "kingchoou",
  }).placements[0]!;
  const to = { ...from, xPercent: 70, yPercent: 22 };
  const first = createDefaultStrategyMotionPath({
    fromKeyframeId: "kf_1",
    toKeyframeId: "kf_2",
    placementId: from.id,
    from,
    to,
    now: "2026-07-10T12:00:00.000Z",
  });
  const revised = {
    ...first,
    points: [
      { xPercent: 30, yPercent: 55 },
      { xPercent: 52, yPercent: 41 },
      { xPercent: 70, yPercent: 22 },
    ],
  };

  const inserted = upsertStrategyMotionPath([], first);
  const updated = upsertStrategyMotionPath(inserted, revised);
  const removed = removeStrategyMotionPath(updated, {
    fromKeyframeId: "kf_1",
    toKeyframeId: "kf_2",
    placementId: from.id,
  });

  assert.equal(inserted.length, 1);
  assert.equal(updated.length, 1);
  assert.equal(updated[0]?.points.length, 3);
  assert.equal(removed.length, 0);
});

test("movement routes normalize legacy endpoints and preserve chained points", () => {
  const legacy = {
    startXPercent: 10,
    startYPercent: 20,
    endXPercent: 80,
    endYPercent: 70,
  };
  assert.deepEqual(getStrategyRoutePoints(legacy), [
    { xPercent: 10, yPercent: 20 },
    { xPercent: 80, yPercent: 70 },
  ]);

  const chained = createStrategyMovementRoute([
    { xPercent: 10, yPercent: 20 },
    { xPercent: 45, yPercent: 30 },
    { xPercent: 80, yPercent: 70 },
  ]);
  assert.equal(chained.points?.length, 3);
  assert.equal(chained.endXPercent, 80);
});

test("renderable routes cannot outlive their owning hero", () => {
  const placed = placeStrategyHero([], {
    heroId: "chou",
    heroName: "Chou",
    xPercent: 20,
    yPercent: 30,
    actorUsername: "kingchoou",
  }).placements[0]!;
  const route = createStrategyMovementRoute([
    { xPercent: 20, yPercent: 30 },
    { xPercent: 60, yPercent: 70 },
  ]);
  const withRoute = updateStrategyPlacement([placed], placed.id, { movementRoute: route });

  assert.equal(getRenderableStrategyRoutes(withRoute).length, 1);
  assert.equal(getRenderableStrategyRoutes(removeStrategyPlacement(withRoute, placed.id)).length, 0);
});

test("placements can be moved and removed without mutating the source list", () => {
  const placed = placeStrategyHero([], {
    heroId: "chou",
    heroName: "Chou",
    xPercent: 20,
    yPercent: 30,
    actorUsername: "kingchoou",
  }).placements;
  const moved = moveStrategyPlacement(placed, placed[0]!.id, 72, 84);
  const removed = removeStrategyPlacement(moved, placed[0]!.id);

  assert.equal(placed[0]?.xPercent, 20);
  assert.equal(moved[0]?.xPercent, 72);
  assert.equal(removed.length, 0);
});

test("editor toggles normalize usernames", () => {
  assert.deepEqual(toggleStrategyEditor([], " Omen "), ["omen"]);
  assert.deepEqual(toggleStrategyEditor(["omen"], "OMEN"), []);
});
