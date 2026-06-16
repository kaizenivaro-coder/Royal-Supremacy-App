import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { mockAnnouncements, mockMembers } from "../data/mock.ts";
import { getLatestAnnouncements, groupMembersByTeam } from "../lib/mvpApp.ts";
import { DashboardQuickActionDialog } from "./Dashboard.tsx";

test("dashboard quick action dialog uses the focused modal treatment", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(DashboardQuickActionDialog, {
        panel: "announcements",
        isVisible: true,
        latestAnnouncements: getLatestAnnouncements(mockAnnouncements),
        teamGroups: groupMembersByTeam(mockMembers),
        pendingTryoutsCount: 1,
        currentMember: mockMembers[0],
        authUsername: "kingchoou",
        notifications: [],
        teamNames: ["Royal Supremacy Team A", "Unassigned"],
        onClose: () => undefined,
      }),
    ),
  );

  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /backdrop-blur-sm/);
  assert.match(html, /transition-opacity/);
  assert.match(html, /scale-100/);
  assert.match(html, /Close quick action panel/);
  assert.match(html, /data-background-scroll-lock="enabled"/);
  assert.doesNotMatch(html, /max-w-lg/);
  assert.doesNotMatch(html, /Close modal/);
});
