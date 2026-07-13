import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./MobilePreview.tsx", import.meta.url), "utf8");

test("mobile preview is presented as a responsive design and development utility", () => {
  assert.match(source, /Responsive Preview/);
  assert.match(source, /design|development|QA/i);
  assert.doesNotMatch(source, /Phone Preview|\bMVP\b/i);
});
