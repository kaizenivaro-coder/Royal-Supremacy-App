import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { mockAnnouncements, mockMembers } from "../data/mock.ts";
import {
  ACTIVE_SEASON,
  createSeedRankHistory,
  createSeedRpTransactions,
} from "../data/leaderboardSeed.ts";
import { getLatestAnnouncements, groupMembersByTeam } from "../lib/mvpApp.ts";
import {
  DashboardQuickActionDialog,
  createDashboardAnalyticsCards,
} from "./Dashboard.tsx";

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

test("dashboard analytics are derived from active MVP data", () => {
  const cards = createDashboardAnalyticsCards({
    currentMember: mockMembers[0],
    members: mockMembers,
    rpTransactions: createSeedRpTransactions(),
    rankHistory: createSeedRankHistory(),
    activeSeasonId: ACTIVE_SEASON.id,
    pendingTryoutsCount: 1,
  });

  assert.deepEqual(
    cards.map((card) => card.label),
    ["Current RP", "Mythic Stars", "Pending Tryouts"],
  );
  assert.deepEqual(
    cards.map((card) => card.value),
    ["388", "57", "1"],
  );
  assert.equal(cards.some((card) => /coming soon|local mvp/i.test(card.value)), false);
});
