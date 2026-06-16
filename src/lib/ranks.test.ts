import assert from "node:assert/strict";
import test from "node:test";
import { getRankIcon, SQUAD_RANKS } from "./ranks.ts";

test("rank metadata includes the full accepted squad rank icon set", () => {
  assert.deepEqual(
    SQUAD_RANKS.map((rank) => rank.name),
    [
      "Unranked",
      "Grandmaster",
      "Epic",
      "Legend",
      "Mythic",
      "Mythical Honor",
      "Mythical Glory",
      "Mythical Immortal",
    ],
  );

  assert.deepEqual(
    SQUAD_RANKS.map((rank) => rank.iconSrc),
    [
      "/ranks/unranked.png",
      "/ranks/grandmaster.png",
      "/ranks/epic.png",
      "/ranks/legend.png",
      "/ranks/mythic.png",
      "/ranks/mythical-honor.png",
      "/ranks/mythical-glory.png",
      "/ranks/mythical-immortal.png",
    ],
  );
});

test("getRankIcon resolves accepted rank labels and falls back to Unranked", () => {
  assert.equal(getRankIcon("Epic").name, "Epic");
  assert.equal(getRankIcon("Mythical Honor")?.name, "Mythical Honor");
  assert.equal(getRankIcon("mythical glory")?.iconSrc, "/ranks/mythical-glory.png");
  assert.equal(getRankIcon("Warrior").name, "Unranked");
  assert.equal(getRankIcon("Unknown Rank").iconSrc, "/ranks/unranked.png");
});
