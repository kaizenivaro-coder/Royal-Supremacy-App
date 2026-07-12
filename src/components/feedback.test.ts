import assert from "node:assert/strict";
import test from "node:test";
import { CircleCheck, Inbox } from "lucide-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState, StatusBanner, ToastRegion } from "./feedback.tsx";

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
  assert.match(html, /Squad saved/);
});
