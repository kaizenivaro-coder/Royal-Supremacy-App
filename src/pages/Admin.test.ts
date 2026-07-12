import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Admin, { AdminLockedGate, UpdateMythicRanksModal } from "./Admin.tsx";
import { mockMembers } from "../data/mock.ts";
import { AppProvider } from "../data/store.tsx";
import { MVP_STORAGE_VERSION } from "../lib/mvpApp.ts";

function installAdminRenderGlobals() {
  const storage = new Map<string, string>([
    ["royal_supremacy_schema_version", MVP_STORAGE_VERSION],
    ["royal_supremacy_isAdmin", JSON.stringify(true)],
  ]);

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { search: "" } },
  });
}

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

test("active Admin UI does not mention retired tryouts", () => {
  installAdminRenderGlobals();

  const html = renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/admin"] },
        React.createElement(Admin),
      ),
    ),
  );

  assert.doesNotMatch(html, /tryouts/i);
});
