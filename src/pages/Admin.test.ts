import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Admin, { AdminLockedGate, UpdateMythicRanksModal } from "./Admin.tsx";
import { mockMembers } from "../data/mock.ts";
import { AppProvider } from "../data/store.tsx";
import { MVP_STORAGE_VERSION } from "../lib/mvpApp.ts";

function installAdminRenderGlobals(search = "") {
  const storage = new Map<string, string>([
    ["royal_supremacy_schema_version", MVP_STORAGE_VERSION],
    ["royal_supremacy_isAdmin", JSON.stringify(true)],
    [
      "royal_supremacy_auth_accounts",
      JSON.stringify([
        {
          id: "auth_alpha",
          username: "alpha",
          passwordHash: "hash_alpha",
          createdAt: "2026-07-12T00:00:00.000Z",
        },
        {
          id: "auth_bravo",
          username: "bravo",
          passwordHash: "hash_bravo",
          createdAt: "2026-07-12T00:00:00.000Z",
        },
      ]),
    ],
    [
      "royal_supremacy_pendingAccountRequests",
      JSON.stringify([
        {
          id: "request_charlie",
          username: "charlie",
          passwordHash: "hash_charlie",
          requestedAt: "2026-07-12T00:00:00.000Z",
        },
      ]),
    ],
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
    value: { location: { search } },
  });
}

function renderUnlockedAdmin(search = "") {
  installAdminRenderGlobals(search);

  return renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/admin${search}`] },
        React.createElement(Admin),
      ),
    ),
  );
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
  assert.doesNotMatch(html, /MVP|tryouts/i);
});

test("admin overview separates truthful account, roster, request, and team metrics", () => {
  const text = renderUnlockedAdmin().replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

  assert.match(text, /2Approved Accounts/);
  assert.match(text, /21Active Roster/);
  assert.match(text, /1Pending Requests/);
  assert.match(text, /5Teams/);
});

test("active unlocked Admin overview does not mention MVP or Tryouts", () => {
  const html = renderUnlockedAdmin();
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

  assert.doesNotMatch(text, /MVP|tryouts/i);
});
