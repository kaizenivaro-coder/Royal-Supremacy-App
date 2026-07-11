import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "../data/store.tsx";
import RootLayout from "./layout.tsx";

function installLocalStorageStub() {
  const storage = new Map<string, string>();
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

test("desktop sidebar stays pinned while page content scrolls", () => {
  installLocalStorageStub();

  const html = renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/leaderboard"] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { path: "/", element: React.createElement(RootLayout) },
            React.createElement(Route, {
              path: "leaderboard",
              element: React.createElement("section", null, "Leaderboard"),
            }),
          ),
        ),
      ),
    ),
  );

  assert.match(html, /class="[^"]*\bfixed\b[^"]*\binset-y-0\b[^"]*\bleft-0\b[^"]*\blg:block/);
  assert.match(html, /class="[^"]*\blg:pl-64\b/);
  assert.doesNotMatch(html, /MVP Command/);
});

test("sidebar navigation does not expose Tryouts", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/"] },
        React.createElement(RootLayout),
      ),
    ),
  );

  assert.doesNotMatch(html, />Tryouts</);
});
