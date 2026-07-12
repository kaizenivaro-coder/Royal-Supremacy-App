import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after, afterEach } from "node:test";
import { JSDOM } from "jsdom";
import React, { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverlayProps } from "./overlays.tsx";

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
  HTMLInputElement: dom.window.HTMLInputElement,
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

const { cleanup, fireEvent, render, waitFor } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { FocusedDialog, MobileSheet } = await import("./overlays.tsx");

type OverlayComponent = React.ComponentType<OverlayProps>;

function OverlayHarness({
  Component = FocusedDialog,
  title = "Edit profile",
  onClosed,
}: {
  Component?: OverlayComponent;
  title?: string;
  onClosed?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "button",
      { type: "button", onClick: () => setOpen(true) },
      "Open overlay",
    ),
    React.createElement(
      Component,
      {
        open,
        title,
        onClose: () => {
          onClosed?.();
          setOpen(false);
        },
        footer: React.createElement("button", { type: "button" }, "Save"),
      },
      React.createElement("button", { type: "button" }, "First action"),
      React.createElement("button", { type: "button" }, "Last action"),
    ),
  );
}

function StackedOverlayHarness() {
  const [firstOpen, setFirstOpen] = useState(true);
  const [secondOpen, setSecondOpen] = useState(false);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      FocusedDialog,
      {
        open: firstOpen,
        title: "First dialog",
        onClose: () => setFirstOpen(false),
      },
      React.createElement(
        "button",
        { type: "button", onClick: () => setSecondOpen(true) },
        "Open second dialog",
      ),
    ),
    React.createElement(
      MobileSheet,
      {
        open: secondOpen,
        title: "Second dialog",
        onClose: () => setSecondOpen(false),
      },
      React.createElement("button", { type: "button" }, "Second action"),
    ),
  );
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.cssText = "";
});

after(() => {
  dom.window.close();
});

test("FocusedDialog renders no portal markup during server rendering", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      FocusedDialog,
      { open: true, title: "Edit profile", onClose: () => undefined },
      "Content",
    ),
  );

  assert.equal(html, "");
});

test("FocusedDialog mounts labelled modal content in a body portal", async () => {
  const user = userEvent.setup({ document });
  const view = render(React.createElement(OverlayHarness));

  assert.equal(view.queryByRole("dialog"), null);
  await user.click(view.getByRole("button", { name: "Open overlay" }));

  const dialog = await view.findByRole("dialog", { name: "Edit profile" });
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  assert.equal(view.container.contains(dialog), false);
  assert.ok(document.body.contains(dialog));
  assert.equal(view.container.getAttribute("aria-hidden"), "true");
  assert.ok(view.getByRole("button", { name: "Close Edit profile" }));
  assert.match(dialog.innerHTML, /lucide-arrow-left/);
  assert.match(dialog.className, /rounded-lg/);
  assert.match(dialog.className, /bg-\[#071425\]/);
  assert.match(dialog.innerHTML, /overflow-y-auto/);
  assert.match(dialog.innerHTML, /sticky bottom-0/);
});

test("FocusedDialog focuses its close control and restores the opener on close", async () => {
  const user = userEvent.setup({ document });
  const view = render(React.createElement(OverlayHarness));
  const opener = view.getByRole("button", { name: "Open overlay" });

  opener.focus();
  await user.click(opener);
  const close = await view.findByRole("button", { name: "Close Edit profile" });
  await waitFor(() => assert.equal(document.activeElement, close));

  await user.click(close);
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.equal(document.activeElement, opener);
  assert.equal(view.container.hasAttribute("aria-hidden"), false);
});

test("FocusedDialog closes only from a direct backdrop interaction", async () => {
  let closeCount = 0;
  const user = userEvent.setup({ document });
  const view = render(
    React.createElement(OverlayHarness, {
      onClosed: () => {
        closeCount += 1;
      },
    }),
  );

  await user.click(view.getByRole("button", { name: "Open overlay" }));
  await user.click(await view.findByRole("button", { name: "First action" }));
  assert.equal(closeCount, 0);

  const backdrop = document.querySelector<HTMLElement>(
    "[data-overlay-backdrop]",
  );
  assert.ok(backdrop);
  await user.click(backdrop);
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.equal(closeCount, 1);
});

test("Escape dismissal ignores consumed and composing keyboard events", async () => {
  const user = userEvent.setup({ document });
  const view = render(React.createElement(OverlayHarness));
  await user.click(view.getByRole("button", { name: "Open overlay" }));
  await view.findByRole("dialog");

  const consumeEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") event.preventDefault();
  };
  window.addEventListener("keydown", consumeEscape, { capture: true });
  fireEvent.keyDown(document, { key: "Escape" });
  assert.ok(view.getByRole("dialog"));
  window.removeEventListener("keydown", consumeEscape, { capture: true });

  fireEvent.keyDown(document, { key: "Escape", isComposing: true });
  assert.ok(view.getByRole("dialog"));

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
});

test("stacked overlays dismiss only the topmost and keep body scrolling locked", async () => {
  const user = userEvent.setup({ document });
  const view = render(React.createElement(StackedOverlayHarness));

  await user.click(
    await view.findByRole("button", { name: "Open second dialog" }),
  );
  await view.findByRole("dialog", { name: "Second dialog" });
  await waitFor(() =>
    assert.equal(getComputedStyle(document.body).overflow, "hidden"),
  );

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() =>
    assert.equal(
      view.queryByRole("dialog", { name: "Second dialog" }),
      null,
    ),
  );
  assert.ok(view.getByRole("dialog", { name: "First dialog" }));
  assert.equal(getComputedStyle(document.body).overflow, "hidden");

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.notEqual(getComputedStyle(document.body).overflow, "hidden");
});

test("FocusedDialog contains keyboard focus while tabbing", async () => {
  const user = userEvent.setup({ document });
  const view = render(React.createElement(OverlayHarness));
  await user.click(view.getByRole("button", { name: "Open overlay" }));

  const close = await view.findByRole("button", { name: "Close Edit profile" });
  const save = view.getByRole("button", { name: "Save" });
  await waitFor(() => assert.equal(document.activeElement, close));

  await user.tab({ shift: true });
  assert.equal(document.activeElement, save);
  await user.tab();
  assert.equal(document.activeElement, close);
});

test("MobileSheet is bottom anchored on mobile and centered on desktop", async () => {
  const user = userEvent.setup({ document });
  const view = render(
    React.createElement(OverlayHarness, {
      Component: MobileSheet,
      title: "More",
    }),
  );

  await user.click(view.getByRole("button", { name: "Open overlay" }));
  const dialog = await view.findByRole("dialog", { name: "More" });
  const backdrop = document.querySelector<HTMLElement>(
    "[data-overlay-backdrop]",
  );

  assert.ok(backdrop);
  assert.match(backdrop.className, /backdrop-blur/);
  assert.match(dialog.className, /bottom-0/);
  assert.match(dialog.className, /md:top-1\/2/);
  assert.match(dialog.className, /rounded-t-lg/);
  assert.match(dialog.className, /md:rounded-lg/);
});

test("global CSS resets motion and delay timing for reduced motion", () => {
  const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");

  assert.match(css, /--mobile-bottom-nav-height:\s*72px/);
  assert.match(css, /--focus-ring:\s*0 0 0 3px rgb\(75 174 255 \/ 0\.42\)/);
  assert.match(css, /:focus-visible\s*{/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation-duration:\s*0\.01ms !important/);
  assert.match(css, /animation-delay:\s*0ms !important/);
  assert.match(css, /transition-duration:\s*0\.01ms !important/);
  assert.match(css, /transition-delay:\s*0ms !important/);
});
