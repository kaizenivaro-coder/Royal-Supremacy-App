import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MVP_STORAGE_VERSION } from "../lib/mvpApp.ts";
import { AppProvider, shouldSeedMvpAccounts, useAppStore } from "./store.tsx";
import { SEED_AUTH_CREDENTIALS } from "./leaderboardSeed.ts";

function installLocalStorageStub(initialValues: Record<string, string> = {}) {
  const storage = new Map(Object.entries(initialValues));
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
  return storage;
}

function ApprovedAccountCountProbe() {
  const { approvedAccountCount } = useAppStore();
  return React.createElement("output", null, approvedAccountCount);
}

test("local account seeding can be disabled for a cleared local browser", () => {
  installLocalStorageStub({
    royal_supremacy_disable_seed_accounts: "true",
  });

  assert.equal(shouldSeedMvpAccounts(), false);
});

test("local account seeding stays enabled by default", () => {
  installLocalStorageStub();

  assert.equal(shouldSeedMvpAccounts(), true);
});

test("the canonical seeded auth set contains only King Choou", () => {
  assert.deepEqual(SEED_AUTH_CREDENTIALS.map((account) => account.username), ["kingchoou"]);
  assert.equal(SEED_AUTH_CREDENTIALS[0]?.password, "Toxic0303#");
});

test("provider exposes approved account count without persisting a dedicated count", () => {
  const storage = installLocalStorageStub({
    royal_supremacy_schema_version: MVP_STORAGE_VERSION,
    royal_supremacy_auth_accounts: JSON.stringify([{ id: "auth_kingchoou" }]),
  });

  const html = renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(ApprovedAccountCountProbe),
    ),
  );

  assert.equal(html, "<output>1</output>");
  assert.equal(storage.has("royal_supremacy_approvedAccountCount"), false);
});
