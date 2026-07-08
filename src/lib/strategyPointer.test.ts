import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyStrategyPointerIntent,
  getMovementDurationMs,
} from "./strategyPointer.ts";

test("pointer movement wins over long press after the drag threshold", () => {
  assert.equal(classifyStrategyPointerIntent(8, 120), "drag");
  assert.equal(classifyStrategyPointerIntent(2, 520), "movement");
  assert.equal(classifyStrategyPointerIntent(2, 120), "pending");
});

test("movement duration uses constant speed with practical bounds", () => {
  assert.equal(getMovementDurationMs(160, 160), 1000);
  assert.equal(getMovementDurationMs(20, 160), 500);
  assert.equal(getMovementDurationMs(2000, 160), 5000);
});
