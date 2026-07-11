import assert from "node:assert/strict";
import test from "node:test";
import { shouldSeedMvpAccounts } from "./store.tsx";
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
