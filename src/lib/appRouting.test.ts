import assert from "node:assert/strict";
import test from "node:test";
import { createHashRouteHref } from "./appRouting.ts";

test("creates a hash route href for the live site root", () => {
  assert.equal(
    createHashRouteHref(
      {
        origin: "https://royal-supremacy-app.kaizenivaro.chatgpt.site",
        pathname: "/",
      },
      "/auth",
    ),
    "https://royal-supremacy-app.kaizenivaro.chatgpt.site/#/auth",
  );
});

test("creates a hash route href for a GitHub Pages base", () => {
  assert.equal(
    createHashRouteHref(
      {
        origin: "https://kaizenivaro-coder.github.io",
        pathname: "/Royal-Supremacy-App/",
      },
      "/profile?tab=rank",
    ),
    "https://kaizenivaro-coder.github.io/Royal-Supremacy-App/#/profile?tab=rank",
  );
});

test("normalizes missing document and route slashes", () => {
  assert.equal(
    createHashRouteHref(
      {
        origin: "https://kaizenivaro-coder.github.io",
        pathname: "/Royal-Supremacy-App",
      },
      "auth",
    ),
    "https://kaizenivaro-coder.github.io/Royal-Supremacy-App/#/auth",
  );
});
