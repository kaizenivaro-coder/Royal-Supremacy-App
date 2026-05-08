import assert from "node:assert/strict";
import test from "node:test";
import { formatHeroIconName } from "./HeroIcon.tsx";

test("formatHeroIconName matches normalized public hero asset names", () => {
  assert.equal(formatHeroIconName("Yi Sun-shin"), "yi_sun_shin");
  assert.equal(formatHeroIconName("Yu Zhong"), "yu_zhong");
  assert.equal(formatHeroIconName("X.Borg"), "x_borg");
  assert.equal(formatHeroIconName("Chang'e"), "chang_e");
  assert.equal(formatHeroIconName("Popol and Kupa"), "popol_and_kupa");
});
