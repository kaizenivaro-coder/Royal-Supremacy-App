import assert from "node:assert/strict";
import test from "node:test";
import type { AppPath, NavigationItem } from "./navigation.ts";
import {
  getDesktopNavigation,
  getMobilePrimaryNavigation,
  getMoreNavigation,
} from "./navigation.ts";

const allAppPaths = [
  "/",
  "/profile",
  "/teams",
  "/leaderboard",
  "/strategy",
  "/announcements",
  "/notifications",
  "/admin",
] as const satisfies readonly AppPath[];

test("mobile primary navigation uses the mobile-first routes and labels", () => {
  const nonAdminNavigation = getMobilePrimaryNavigation(false);
  const adminNavigation = getMobilePrimaryNavigation(true);

  assert.deepEqual(
    nonAdminNavigation.map((item) => item.path),
    ["/", "/teams", "/strategy", "/announcements", "/profile"],
  );
  assert.deepEqual(
    nonAdminNavigation.map((item) => item.name),
    ["Home", "Teams", "Strategy", "Decrees", "Profile"],
  );
  assert.equal(nonAdminNavigation.length, 5);
  assert.equal(adminNavigation.length, 5);
  assert.deepEqual(adminNavigation, nonAdminNavigation);
});

test("more navigation only includes the admin portal for admins", () => {
  assert.deepEqual(
    getMoreNavigation(false).map((item) => item.path),
    ["/leaderboard", "/notifications"],
  );
  assert.deepEqual(
    getMoreNavigation(true).map((item) => item.path),
    ["/leaderboard", "/notifications", "/admin"],
  );
});

test("desktop navigation only includes the admin portal for admins", () => {
  assert.deepEqual(
    getDesktopNavigation(false).map((item) => item.path),
    ["/", "/profile", "/teams", "/leaderboard", "/strategy", "/announcements"],
  );
  assert.deepEqual(
    getDesktopNavigation(true).map((item) => item.path),
    ["/", "/profile", "/teams", "/leaderboard", "/strategy", "/announcements", "/admin"],
  );
});

test("navigation selectors cover the canonical application route contract", () => {
  const selectedPaths = new Set<AppPath>([
    ...getMobilePrimaryNavigation(true).map((item) => item.path),
    ...getMoreNavigation(true).map((item) => item.path),
    ...getDesktopNavigation(true).map((item) => item.path),
  ]);

  assert.deepEqual([...selectedPaths].sort(), [...allAppPaths].sort());
  assert.equal(getMobilePrimaryNavigation(true).some((item) => item.path === "/notifications"), false);
});

test("navigation metadata and selector results cannot poison later calls", () => {
  const firstResult = getDesktopNavigation(true);
  const firstItem = firstResult[0] as NavigationItem;
  const originalName = firstItem.name;
  const changedItem = Reflect.set(firstItem, "name", "Poisoned");
  const removedItem = Reflect.deleteProperty(firstResult, "0");
  const laterResult = getDesktopNavigation(true);
  const laterName = laterResult[0].name;

  if (changedItem) {
    Reflect.set(firstItem, "name", originalName);
  }

  assert.equal(Object.isFrozen(firstResult), true);
  assert.equal(Object.isFrozen(firstItem), true);
  assert.equal(changedItem, false);
  assert.equal(removedItem, false);
  assert.equal(laterName, "Home");
  assert.equal(laterResult.length, 7);
});

if (false) {
  const navigation = getMobilePrimaryNavigation(false);

  // @ts-expect-error navigation metadata is readonly
  navigation[0].name = "Poisoned";
}

test("tryouts never appears in application navigation", () => {
  const navigation = [
    ...getMobilePrimaryNavigation(true),
    ...getMoreNavigation(true),
    ...getDesktopNavigation(true),
  ];

  assert.equal(
    navigation.some(
      (item) => item.path.toLowerCase().includes("tryouts") || item.name.toLowerCase().includes("tryouts"),
    ),
    false,
  );
});
