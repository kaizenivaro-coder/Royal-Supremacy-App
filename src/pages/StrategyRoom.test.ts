import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StrategyHeroMenu } from "../components/StrategyHeroMenu.tsx";
import { StrategyMovementOverlay } from "../components/StrategyMovementOverlay.tsx";

test("strategy hero menu exposes tactical actions and team outlines", () => {
  const html = renderToStaticMarkup(React.createElement(StrategyHeroMenu, {
    x: 100,
    y: 120,
    hasRoute: true,
    onMovement: () => undefined,
    onReplay: () => undefined,
    onRename: () => undefined,
    onTeamColor: () => undefined,
    onDuplicate: () => undefined,
    onClear: () => undefined,
    onClose: () => undefined,
  }));

  assert.match(html, /Movement/);
  assert.match(html, /Replay Movement/);
  assert.match(html, /Rename/);
  assert.match(html, /Blue Team/);
  assert.match(html, /Red Team/);
  assert.match(html, /Duplicate Hero/);
  assert.match(html, /Clear Hero/);
});

test("movement overlay renders saved and preview routes", () => {
  const html = renderToStaticMarkup(React.createElement(StrategyMovementOverlay, {
    routes: [{ id: "route", teamColor: "blue", route: { startXPercent: 10, startYPercent: 20, endXPercent: 80, endYPercent: 60 } }],
    preview: { id: "preview", teamColor: "red", route: { startXPercent: 40, startYPercent: 50, endXPercent: 70, endYPercent: 30 } },
  }));

  assert.match(html, /strategy-route-blue/);
  assert.match(html, /strategy-route-red/);
  assert.match(html, /marker-end/);
});
