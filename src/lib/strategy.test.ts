import assert from "node:assert/strict";
import test from "node:test";
import {
  canEditPublicStrategy,
  moveStrategyPlacement,
  placeStrategyHero,
  removeStrategyPlacement,
  toggleStrategyEditor,
} from "./strategy.ts";

test("public strategy editing is limited to admins and assigned editors", () => {
  assert.equal(canEditPublicStrategy(true, "kingchoou", []), true);
  assert.equal(canEditPublicStrategy(false, "omen", ["omen"]), true);
  assert.equal(canEditPublicStrategy(false, "omen", ["kingvoid"]), false);
});

test("placing a hero clamps map coordinates and prevents duplicates", () => {
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
  assert.equal(duplicate.error, "Chou is already on this map.");
  assert.equal(duplicate.placements.length, 1);
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
