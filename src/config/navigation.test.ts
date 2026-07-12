import assert from "node:assert/strict";
import test from "node:test";
import {
  getDesktopNavigation,
  getMobilePrimaryNavigation,
  getMoreNavigation,
} from "./navigation.ts";

test("mobile primary navigation uses the mobile-first routes and labels", () => {
  const navigation = getMobilePrimaryNavigation(false);

  assert.deepEqual(
    navigation.map((item) => item.path),
    ["/", "/teams", "/strategy", "/announcements", "/profile"],
  );
  assert.deepEqual(
    navigation.map((item) => item.name),
    ["Home", "Teams", "Strategy", "Decrees", "Profile"],
  );
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
  assert.equal(getDesktopNavigation(false).some((item) => item.path === "/admin"), false);
  assert.equal(getDesktopNavigation(true).some((item) => item.path === "/admin"), true);
});

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
