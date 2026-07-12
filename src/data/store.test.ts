import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MVP_STORAGE_VERSION } from "../lib/mvpApp.ts";
import {
  AppProvider,
  RETIRED_STORAGE_KEYS,
  runMvpMigration,
  shouldSeedMvpAccounts,
  useAppStore,
} from "./store.tsx";
import { SEED_AUTH_CREDENTIALS } from "./leaderboardSeed.ts";

const PREVIOUS_MVP_STORAGE_VERSION = "royal-supremacy-mvp-2026-05-28-leaderboard";

const migrationActiveData = {
  members: [{ id: "member_custom", username: "custom-player", playerName: "Custom Player" }],
  notifications: [{ id: "notification_custom", message: "Keep me" }],
  seasons: [{ id: "season_custom", name: "Custom Season" }],
  teams: [{ id: "team_custom", name: "Custom Team" }],
  rpTransactions: [{ id: "rp_custom", amount: 77 }],
  rankHistory: [{ id: "rank_custom", stars: 88 }],
  pendingAccountRequests: [{ id: "request_custom", username: "custom-player" }],
};

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

function installMigrationStorage(version: string) {
  return installLocalStorageStub({
    royal_supremacy_schema_version: JSON.stringify(version),
    royal_supremacy_tryouts: JSON.stringify([{ id: "tryout_legacy" }]),
    ...Object.fromEntries(
      Object.entries(migrationActiveData).map(([key, value]) => [
        `royal_supremacy_${key}`,
        JSON.stringify(value),
      ]),
    ),
  });
}

function migrateInstalledStorage() {
  runMvpMigration(localStorage);
}

function assertActiveMigrationDataIsPreserved(storage: Map<string, string>) {
  Object.entries(migrationActiveData).forEach(([key, value]) => {
    assert.deepEqual(JSON.parse(storage.get(`royal_supremacy_${key}`) ?? "null"), value);
  });
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

test("retired storage keys include legacy tryouts data", () => {
  assert.ok(RETIRED_STORAGE_KEYS.includes("tryouts"));
});

test("migration advances a previous version without replacing active data", () => {
  const storage = installMigrationStorage(PREVIOUS_MVP_STORAGE_VERSION);

  migrateInstalledStorage();

  assertActiveMigrationDataIsPreserved(storage);
  assert.equal(storage.has("royal_supremacy_tryouts"), false);
  assert.equal(
    JSON.parse(storage.get("royal_supremacy_schema_version") ?? "null"),
    MVP_STORAGE_VERSION,
  );
});

test("migration removes retired data when the schema version is already current", () => {
  const storage = installMigrationStorage(MVP_STORAGE_VERSION);

  migrateInstalledStorage();

  assertActiveMigrationDataIsPreserved(storage);
  assert.equal(storage.has("royal_supremacy_tryouts"), false);
});

test("repeating the migration leaves preserved active data unchanged", () => {
  const storage = installMigrationStorage(PREVIOUS_MVP_STORAGE_VERSION);

  migrateInstalledStorage();
  const storageAfterFirstMigration = new Map(storage);
  migrateInstalledStorage();

  assert.deepEqual(storage, storageAfterFirstMigration);
  assertActiveMigrationDataIsPreserved(storage);
  assert.equal(storage.has("royal_supremacy_tryouts"), false);
  assert.equal(
    JSON.parse(storage.get("royal_supremacy_schema_version") ?? "null"),
    MVP_STORAGE_VERSION,
  );
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
