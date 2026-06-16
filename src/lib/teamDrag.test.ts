import assert from "node:assert/strict";
import test from "node:test";
import { getTeamDropTarget } from "./teamDrag.ts";

test("getTeamDropTarget returns the team containing the pointer", () => {
  const zones = [
    { teamName: "Royal Supremacy Team A", left: 10, right: 210, top: 20, bottom: 220 },
    { teamName: "Unassigned", left: 230, right: 430, top: 20, bottom: 220 },
  ];

  assert.equal(
    getTeamDropTarget(zones, { x: 80, y: 100 }),
    "Royal Supremacy Team A",
  );
  assert.equal(getTeamDropTarget(zones, { x: 300, y: 120 }), "Unassigned");
});

test("getTeamDropTarget returns null outside all team zones", () => {
  const zones = [
    { teamName: "Royal Valor Team B", left: 0, right: 200, top: 0, bottom: 200 },
  ];

  assert.equal(getTeamDropTarget(zones, { x: 240, y: 100 }), null);
  assert.equal(getTeamDropTarget(zones, { x: 100, y: 240 }), null);
});
