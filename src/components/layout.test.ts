import assert from "node:assert/strict";
import test, { after, afterEach } from "node:test";
import { JSDOM } from "jsdom";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "../data/store.tsx";

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  url: "http://localhost/",
});

const domGlobals = {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  MutationObserver: dom.window.MutationObserver,
  DOMRect: dom.window.DOMRect,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
};

for (const [name, value] of Object.entries(domGlobals)) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  writable: true,
  value: true,
});

const { cleanup, render, waitFor, within } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const RootLayout = (await import("./layout.tsx")).default;

function installLocalStorageStub(entries: Array<[string, string]> = []) {
  dom.window.localStorage.clear();
  entries.forEach(([key, value]) => dom.window.localStorage.setItem(key, value));
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: dom.window.localStorage,
  });
}

function renderLayout(pathname = "/") {
  return renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [pathname] },
        React.createElement(RootLayout),
      ),
    ),
  );
}

function mountLayout(pathname = "/") {
  return render(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [pathname] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { path: "/", element: React.createElement(RootLayout) },
            React.createElement(Route, {
              path: "*",
              element: React.createElement("section", null, "Page content"),
            }),
          ),
        ),
      ),
    ),
  );
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.cssText = "";
  dom.window.localStorage.clear();
});

after(() => {
  dom.window.close();
});

test("desktop sidebar stays pinned while page content scrolls", () => {
  installLocalStorageStub();

  const html = renderLayout("/leaderboard");

  assert.match(html, /class="[^"]*\bfixed\b[^"]*\binset-y-0\b[^"]*\bleft-0\b[^"]*\blg:block/);
  assert.match(html, /class="[^"]*\blg:pl-64\b/);
  assert.doesNotMatch(html, /MVP Command/);
});

test("mobile primary navigation exposes exactly five one-tap destinations", () => {
  installLocalStorageStub();

  const html = renderLayout("/strategy");
  const primaryNavigation = html.match(
    /<nav[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/,
  )?.[0];

  assert.ok(primaryNavigation);
  assert.equal((primaryNavigation.match(/<a /g) ?? []).length, 5);
  for (const label of ["Home", "Teams", "Strategy", "Decrees", "Profile"]) {
    assert.match(primaryNavigation, new RegExp(`>${label}<`));
  }
  assert.match(primaryNavigation, /grid-cols-5/);
  assert.match(primaryNavigation, /min-h-11/);
  assert.match(primaryNavigation, /text-\[10px\]/);
  assert.doesNotMatch(primaryNavigation, /truncate/);
  assert.match(primaryNavigation, /aria-current="page"[^>]*href="\/strategy"/);
});

test("mobile app bar provides route context, notifications, and More state", () => {
  installLocalStorageStub();

  const html = renderLayout("/announcements");

  assert.match(html, /class="[^"]*\bh-14\b[^"]*\blg:hidden\b/);
  assert.match(html, />Decrees<\/span>/);
  assert.match(html, /aria-label="Notifications"[^>]*href="\/notifications"/);
  assert.match(html, /aria-label="Open more navigation"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /aria-label="Toggle navigation"/);
  assert.equal((html.match(/<aside/g) ?? []).length, 1);
});

test("mobile shell reserves top, bottom, and safe-area content clearance", () => {
  installLocalStorageStub();

  const html = renderLayout();

  assert.match(html, /pt-14/);
  assert.match(
    html,
    /pb-\[calc\(var\(--mobile-bottom-nav-height\)\+env\(safe-area-inset-bottom\)\+16px\)\]/,
  );
  assert.match(html, /padding-bottom:env\(safe-area-inset-bottom\)/);
  assert.match(
    html,
    /class="[^"]*h-\[var\(--mobile-bottom-nav-height\)\][^"]*grid-cols-5/,
  );
});

test("sidebar navigation does not expose Tryouts", () => {
  installLocalStorageStub();

  const html = renderLayout();

  assert.doesNotMatch(html, />Tryouts</);
});

test("navigation follows admin access from shared navigation config", () => {
  installLocalStorageStub();
  const nonAdminHtml = renderLayout();

  installLocalStorageStub([["royal_supremacy_isAdmin", JSON.stringify(true)]]);
  const adminHtml = renderLayout();

  assert.doesNotMatch(nonAdminHtml, />Admin Portal</);
  assert.match(adminHtml, />Admin Portal</);
  assert.match(nonAdminHtml, />Home</);
  assert.match(nonAdminHtml, />Decrees</);
});

test("More sheet closes after navigation and only shows Admin Portal to admins", async () => {
  installLocalStorageStub();
  const user = userEvent.setup({ document });
  const nonAdmin = mountLayout();
  const moreButton = nonAdmin.getByRole("button", { name: "Open more navigation" });

  await user.click(moreButton);

  const nonAdminSheet = await nonAdmin.findByRole("dialog", { name: "More" });
  assert.equal(moreButton.getAttribute("aria-expanded"), "true");
  assert.ok(within(nonAdminSheet).getByRole("link", { name: "Leaderboard" }));
  assert.ok(within(nonAdminSheet).getByRole("link", { name: "Notifications" }));
  assert.equal(within(nonAdminSheet).queryByRole("link", { name: "Admin Portal" }), null);

  await user.click(within(nonAdminSheet).getByRole("link", { name: "Leaderboard" }));
  await waitFor(() => assert.equal(nonAdmin.queryByRole("dialog", { name: "More" }), null));
  assert.equal(moreButton.getAttribute("aria-expanded"), "false");

  cleanup();
  installLocalStorageStub([["royal_supremacy_isAdmin", JSON.stringify(true)]]);
  const admin = mountLayout();

  await user.click(admin.getByRole("button", { name: "Open more navigation" }));

  const adminSheet = await admin.findByRole("dialog", { name: "More" });
  assert.ok(within(adminSheet).getByRole("link", { name: "Admin Portal" }));
});

test("Sign Out closes More and clears the active session", async () => {
  installLocalStorageStub([
    [
      "royal_supremacy_auth_session",
      JSON.stringify({ id: "user-1", username: "commander" }),
    ],
    ["royal_supremacy_isAdmin", JSON.stringify(true)],
  ]);
  const user = userEvent.setup({ document });
  const screen = mountLayout();

  await user.click(screen.getByRole("button", { name: "Open more navigation" }));
  const sheet = await screen.findByRole("dialog", { name: "More" });
  await user.click(within(sheet).getByRole("button", { name: "Sign Out" }));

  await waitFor(() => assert.equal(screen.queryByRole("dialog", { name: "More" }), null));
  assert.equal(localStorage.getItem("royal_supremacy_auth_session"), null);
  assert.equal(
    localStorage.getItem("royal_supremacy_isAdmin"),
    JSON.stringify(false),
  );
});
