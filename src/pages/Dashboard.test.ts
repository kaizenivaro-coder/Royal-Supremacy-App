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
import { AppProvider } from "../data/store.tsx";
import { getLatestAnnouncements, groupMembersByTeam } from "../lib/mvpApp.ts";
import Dashboard, {
  DashboardQuickActionDialog,
  createDashboardAnalyticsCards,
} from "./Dashboard.tsx";

function installDashboardRenderGlobals() {
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

test("dashboard analytics use the active roster and exact product labels", () => {
  const cards = createDashboardAnalyticsCards({
    currentMember: mockMembers[0],
    members: [
      ...mockMembers,
      {
        ...mockMembers[1],
        id: "member_archived",
        lifecycleStatus: "Archived",
      },
    ],
    rpTransactions: createSeedRpTransactions(),
    rankHistory: createSeedRankHistory(),
    activeSeasonId: ACTIVE_SEASON.id,
  });

  assert.deepEqual(
    cards.map((card) => card.label),
    ["Current RP", "Mythic Stars", "Squad Members"],
  );
  assert.deepEqual(
    cards.map((card) => card.value),
    ["388", "57", "21"],
  );
  assert.equal(cards.some((card) => /coming soon|local mvp/i.test(card.value)), false);
});

test("dashboard renders current squad copy without stale MVP language", () => {
  installDashboardRenderGlobals();

  const dashboardHtml = renderToStaticMarkup(
    React.createElement(
      AppProvider,
      null,
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Dashboard),
      ),
    ),
  );
  const sharedDialogProps = {
    isVisible: true,
    latestAnnouncements: getLatestAnnouncements(mockAnnouncements),
    teamGroups: groupMembersByTeam(mockMembers),
    currentMember: mockMembers[0],
    authUsername: "kingchoou",
    notifications: [],
    teamNames: ["Royal Supremacy Team A", "Unassigned"],
    onClose: () => undefined,
  };
  const dialogHtml = (["teams", "notify"] as const)
    .map((panel) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(DashboardQuickActionDialog, {
            ...sharedDialogProps,
            panel,
          }),
        ),
      ),
    )
    .join("");
  const html = dashboardHtml + dialogHtml;

  assert.match(html, /Squad Command/);
  assert.doesNotMatch(html, /MVP/i);
  assert.doesNotMatch(html, /first usable squad build/i);
});
