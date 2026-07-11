import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StrategyHeroMenu } from "../components/StrategyHeroMenu.tsx";
import { StrategyMovementOverlay } from "../components/StrategyMovementOverlay.tsx";
import { StrategyExitControl, StrategyMovementDraftControls } from "./StrategyRoom.tsx";

test("strategy hero menu exposes tactical actions and team outlines", () => {
  const html = renderToStaticMarkup(React.createElement(StrategyHeroMenu, {
    x: 100,
    y: 120,
    hasRoute: true,
    hasMotionPath: true,
    canEditMotionPath: true,
    onMovement: () => undefined,
    onEditMotionPath: () => undefined,
    onReplay: () => undefined,
    onRename: () => undefined,
    onTeamColor: () => undefined,
    onDuplicate: () => undefined,
    onClearMovement: () => undefined,
    onClearMotionPath: () => undefined,
    onClear: () => undefined,
    onClose: () => undefined,
  }));

  assert.match(html, /Movement/);
  assert.match(html, /Edit Motion Path/);
  assert.match(html, /Replay Movement/);
  assert.match(html, /Rename/);
  assert.match(html, /Blue Team/);
  assert.match(html, /Red Team/);
  assert.match(html, /Duplicate Hero/);
  assert.match(html, /Clear Movement Line/);
  assert.match(html, /Clear Motion Path/);
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
  assert.match(html, /polyline/);
  assert.match(html, /10,20 80,60/);
});

test("desktop movement drafts expose explicit finish and cancel controls", () => {
  const html = renderToStaticMarkup(React.createElement(StrategyMovementDraftControls, {
    inputMode: "desktop",
    waypointCount: 5,
    onUndo: () => undefined,
    onCancel: () => undefined,
    onFinish: () => undefined,
  }));

  assert.match(html, /Undo waypoint/);
  assert.match(html, /Cancel movement/);
  assert.match(html, /Finish movement/);
  assert.match(html, /Right-click adds waypoints/);
});

test("strategy room exposes a direct mobile exit control", () => {
  const html = renderToStaticMarkup(
    React.createElement(StrategyExitControl, {
      onExit: () => undefined,
      isVisible: true,
    }),
  );

  assert.match(html, /Exit strategy room/);
  assert.match(html, /Exit/);
  assert.match(html, /backdrop-blur-lg/);
});
