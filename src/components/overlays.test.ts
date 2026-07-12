import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FocusedDialog,
  MobileSheet,
  setupOverlayInteractions,
} from "./overlays.tsx";

class FakeFocusable {
  focusCount = 0;

  focus() {
    this.focusCount += 1;
  }
}

function createOverlayEnvironment(focusables: FakeFocusable[] = []) {
  const listeners = new Set<(event: KeyboardEvent) => void>();
  const documentLike = {
    activeElement: null as FakeFocusable | null,
    body: { style: { overflow: "auto" } },
    addEventListener: (_type: string, listener: (event: KeyboardEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: KeyboardEvent) => void) => {
      listeners.delete(listener);
    },
  };
  const dialog = {
    querySelectorAll: () => focusables,
  };

  return { documentLike, dialog, listeners };
}

test("FocusedDialog renders nothing when closed", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      FocusedDialog,
      { open: false, title: "Edit profile", onClose: () => undefined },
      "Content",
    ),
  );

  assert.equal(html, "");
});

test("FocusedDialog renders labelled modal semantics and a named back control", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      FocusedDialog,
      { open: true, title: "Edit profile", onClose: () => undefined },
      "Content",
    ),
  );
  const labelId = html.match(/aria-labelledby="([^"]+)"/)?.[1];

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Close Edit profile"/);
  assert.match(html, /lucide-arrow-left/);
  assert.ok(labelId);
  assert.match(html, new RegExp(`<h2 id="${labelId}"`));
});

test("FocusedDialog provides a blurred backdrop, scrollable body, and sticky footer", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      FocusedDialog,
      {
        open: true,
        title: "Edit profile",
        onClose: () => undefined,
        footer: React.createElement("button", null, "Save"),
      },
      "Content",
    ),
  );

  assert.match(html, /backdrop-blur/);
  assert.match(html, /rounded-lg/);
  assert.match(html, /overflow-y-auto/);
  assert.match(html, /sticky bottom-0/);
  assert.match(html, /overlay-enter/);
});

test("MobileSheet is bottom anchored on mobile and centered on desktop", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MobileSheet,
      { open: true, title: "More", onClose: () => undefined },
      "Sheet content",
    ),
  );

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-label="Close More"/);
  assert.match(html, /items-end/);
  assert.match(html, /md:items-center/);
  assert.match(html, /rounded-t-lg/);
  assert.match(html, /md:rounded-lg/);
});

test("overlay interactions lock scrolling, focus close, handle Escape, and restore state", () => {
  const previousFocus = new FakeFocusable();
  const closeButton = new FakeFocusable();
  const { documentLike, dialog, listeners } = createOverlayEnvironment([closeButton]);
  documentLike.activeElement = previousFocus;
  let closeCount = 0;

  const cleanup = setupOverlayInteractions({
    document: documentLike,
    dialog,
    initialFocus: closeButton,
    onClose: () => {
      closeCount += 1;
    },
  });

  assert.equal(documentLike.body.style.overflow, "hidden");
  assert.equal(closeButton.focusCount, 1);
  assert.equal(listeners.size, 1);

  listeners.forEach((listener) => listener({ key: "Escape" } as KeyboardEvent));
  assert.equal(closeCount, 1);

  cleanup();
  assert.equal(documentLike.body.style.overflow, "auto");
  assert.equal(previousFocus.focusCount, 1);
  assert.equal(listeners.size, 0);
});

test("overlay interactions contain focus at the first and last controls", () => {
  const first = new FakeFocusable();
  const last = new FakeFocusable();
  const { documentLike, dialog, listeners } = createOverlayEnvironment([first, last]);
  const cleanup = setupOverlayInteractions({
    document: documentLike,
    dialog,
    initialFocus: first,
    onClose: () => undefined,
  });
  let prevented = 0;

  documentLike.activeElement = last;
  listeners.forEach((listener) =>
    listener({
      key: "Tab",
      shiftKey: false,
      preventDefault: () => {
        prevented += 1;
      },
    } as unknown as KeyboardEvent),
  );
  assert.equal(first.focusCount, 2);

  documentLike.activeElement = first;
  listeners.forEach((listener) =>
    listener({
      key: "Tab",
      shiftKey: true,
      preventDefault: () => {
        prevented += 1;
      },
    } as unknown as KeyboardEvent),
  );
  assert.equal(last.focusCount, 1);
  assert.equal(prevented, 2);

  cleanup();
});

test("global CSS defines focus, mobile navigation, and reduced-motion foundations", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

  assert.match(css, /--mobile-bottom-nav-height:\s*72px/);
  assert.match(css, /--focus-ring:\s*0 0 0 3px rgb\(75 174 255 \/ 0\.42\)/);
  assert.match(css, /:focus-visible\s*{/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation-duration:\s*0\.01ms !important/);
  assert.match(css, /transition-duration:\s*0\.01ms !important/);
});
