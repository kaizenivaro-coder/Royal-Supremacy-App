import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RankIcon } from "./RankIcon.tsx";

test("RankIcon renders the matching Mythic rank emblem", () => {
  const html = renderToStaticMarkup(
    React.createElement(RankIcon, {
      rankName: "Mythical Glory",
      className: "rank-size",
    }),
  );

  assert.match(html, /src="\/ranks\/mythical-glory\.png"/);
  assert.match(html, /alt="Mythical Glory rank emblem"/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /rank-size/);
});
