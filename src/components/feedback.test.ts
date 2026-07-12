import assert from "node:assert/strict";
import test, { after, afterEach } from "node:test";
import { JSDOM } from "jsdom";
import { CircleCheck, Inbox } from "lucide-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState, StatusBanner, ToastRegion } from "./feedback.tsx";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  Node: { configurable: true, value: dom.window.Node },
  Element: { configurable: true, value: dom.window.Element },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  getComputedStyle: {
    configurable: true,
    value: dom.window.getComputedStyle.bind(dom.window),
  },
  IS_REACT_ACT_ENVIRONMENT: {
    configurable: true,
    writable: true,
    value: true,
  },
});

const { cleanup, render } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;

afterEach(() => cleanup());
after(() => dom.window.close());

const invalidStatusProps: Parameters<typeof StatusBanner>[0] = {
  // @ts-expect-error StatusBanner controls its live-region politeness.
  "aria-live": "off",
};
const invalidEmptyStateProps: Parameters<typeof EmptyState>[0] = {
  title: "Empty",
  // @ts-expect-error EmptyState controls its required status role.
  role: "presentation",
};
const invalidToastProps: Parameters<typeof ToastRegion>[0] = {
  // @ts-expect-error ToastRegion controls which changes are announced.
  "aria-relevant": "removals",
};
void [invalidStatusProps, invalidEmptyStateProps, invalidToastProps];

test("StatusBanner exposes live status semantics and supports a Lucide icon", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      StatusBanner,
      { tone: "success", icon: CircleCheck },
      "Saved",
    ),
  );

  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /lucide-circle-check/);
  assert.match(html, /Saved/);
});

test("StatusBanner uses assertive alert semantics for errors and distinct tone styles", () => {
  const tones = ["info", "success", "warning", "error"] as const;
  const markup = tones.map((tone) =>
    renderToStaticMarkup(
      React.createElement(StatusBanner, { tone }, `${tone} message`),
    ),
  );

  assert.match(markup[0], /border-blue-300/);
  assert.match(markup[1], /border-success/);
  assert.match(markup[2], /border-gold/);
  assert.match(markup[3], /role="alert"/);
  assert.match(markup[3], /aria-live="assertive"/);
  assert.match(markup[3], /border-danger/);
});

test("EmptyState exposes polite status semantics, a heading, content, action, and Lucide icon", () => {
  const html = renderToStaticMarkup(
    React.createElement(EmptyState, {
      icon: Inbox,
      title: "No decrees yet",
      description: "New decrees will appear here.",
      action: React.createElement("button", null, "Create decree"),
    }),
  );

  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<h2/);
  assert.match(html, /No decrees yet/);
  assert.match(html, /New decrees will appear here\./);
  assert.match(html, /Create decree/);
  assert.match(html, /lucide-inbox/);
});

test("ToastRegion is a named polite live region with a usable child API", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ToastRegion,
      { label: "Battle updates" },
      React.createElement("div", null, "Squad saved"),
    ),
  );

  assert.match(html, /role="region"/);
  assert.match(html, /aria-label="Battle updates"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-relevant="additions text"/);
  assert.match(html, /\[&amp;&gt;\*\]:pointer-events-auto/);
  assert.match(html, /Squad saved/);
});

test("ToastRegion children remain clickable", async () => {
  let clickCount = 0;
  const user = userEvent.setup({ document });
  const view = render(
    React.createElement(
      ToastRegion,
      null,
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            clickCount += 1;
          },
        },
        "Undo",
      ),
    ),
  );

  await user.click(view.getByRole("button", { name: "Undo" }));
  assert.equal(clickCount, 1);
});
