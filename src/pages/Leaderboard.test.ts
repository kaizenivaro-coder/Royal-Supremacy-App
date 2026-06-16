import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LeaderboardCommandBoard } from "./Leaderboard.tsx";

const entries = [
  { rank: 1, memberId: "one", displayName: "King Void", score: 562 },
  { rank: 2, memberId: "two", displayName: "Gaytastrophe", score: 521 },
  { rank: 3, memberId: "three", displayName: "Horseman of Hope", score: 494 },
  { rank: 4, memberId: "four", displayName: "King Gato", score: 474 },
];

test("leaderboard command board renders poster-style ranked content without a table", () => {
  const html = renderToStaticMarkup(
    React.createElement(LeaderboardCommandBoard, {
      mode: "rp",
      entries,
      placementEntries: [],
      noStarEntries: [],
      lastUpdated: "2026-05-28T00:00:00.000Z",
      squadLogoSrc: "",
    }),
  );

  assert.match(html, /Royal Supremacy Leaderboard/i);
  assert.match(html, /Current RP Standings/i);
  assert.match(html, /Updated from Admin Portal/i);
  assert.match(html, /King Void/);
  assert.match(html, /Horseman of Hope/);
  assert.match(html, /Top 3/);
  assert.doesNotMatch(html, /<table/i);
});
