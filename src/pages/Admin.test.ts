import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminLockedGate, UpdateMythicRanksModal } from "./Admin.tsx";
import { mockMembers } from "../data/mock.ts";

test("update mythic ranks modal renders focused admin controls for every rank", () => {
  const html = renderToStaticMarkup(
    React.createElement(UpdateMythicRanksModal, {
      isOpen: true,
      members: mockMembers.slice(0, 2),
      currentRanks: new Map([
        [mockMembers[0].id, { rankStatus: "Mythical Glory", stars: 57 }],
        [mockMembers[1].id, { rankStatus: "Legend", stars: 0 }],
      ]),
      onClose: () => undefined,
      onSave: () => undefined,
    }),
  );

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Update Squad Ranks/);
  assert.match(html, /Mythic Placement/);
  assert.match(html, /Mythical Immortal/);
  assert.match(html, /Save Rank Updates/);
  assert.match(html, /backdrop-blur-sm/);
  assert.match(html, /type="number"/);
});

test("admin locked gate exposes an accessible password field", () => {
  const html = renderToStaticMarkup(
    React.createElement(AdminLockedGate, {
      password: "",
      accessError: "",
      onPasswordChange: () => undefined,
      onSubmit: () => undefined,
    }),
  );

  assert.match(html, /for="admin-portal-password"/);
  assert.match(html, /id="admin-portal-password"/);
  assert.match(html, /name="adminPassword"/);
  assert.match(html, /aria-label="Admin Portal password"/);
});
