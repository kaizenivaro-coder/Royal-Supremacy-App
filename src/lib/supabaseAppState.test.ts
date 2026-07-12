import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRemoteAppState,
  reconcileRemoteAppState,
} from "./supabaseAppState.ts";
import {
  ACTIVE_SEASON,
  createSeedMembers,
  createSeedRankHistory,
  createSeedRpTransactions,
} from "../data/leaderboardSeed.ts";
import type { Member } from "../types";

const member = {
  id: "member_001",
  username: "kingchoou",
  playerName: "King Choou",
  mlbbId: "123",
  serverId: "1234",
  mainRole: "EXP Lane",
  secondaryRole: "Roam",
  mainHeroes: ["Chou"],
  currentRank: "Mythical Honor",
  highestRank: "Mythical Glory",
  team: "Unassigned",
  status: "Active",
  bannerId: "chou-stun",
} satisfies Member;

test("normalizeRemoteAppState keeps valid remote MVP state and fills missing optional lists", () => {
  const state = normalizeRemoteAppState({ members: [member], announcements: [] });

  assert.equal(state?.members[0]?.username, "kingchoou");
  assert.deepEqual(state?.notifications, []);
  assert.deepEqual(state?.pendingAccountRequests, []);
  assert.deepEqual(state?.authAccounts, []);
  assert.equal(state?.squadLogoSrc, "");
});

test("normalizeRemoteAppState ignores a legacy tryouts property", () => {
  const state = normalizeRemoteAppState({
    members: [member],
    announcements: [],
    tryouts: [{ id: "tryout_legacy" }],
  });

  assert.ok(state);
  assert.equal("tryouts" in state, false);
});

test("normalizeRemoteAppState rejects data without a members list", () => {
  assert.equal(normalizeRemoteAppState({ announcements: [] }), null);
  assert.equal(normalizeRemoteAppState(null), null);
});

test("reconcileRemoteAppState repairs stale partial remote state with seeded squad data", () => {
  const seedMembers = createSeedMembers();
  const fallback = {
    members: seedMembers,
    announcements: [],
    notifications: [],
    squadLogoSrc: "",
    seasons: [ACTIVE_SEASON],
    teams: [],
    rpTransactions: createSeedRpTransactions(),
    rankHistory: createSeedRankHistory(),
    publicStrategyPlacements: [],
    strategyEditorUsernames: [],
    pendingAccountRequests: [],
    authAccounts: [],
  };
  const staleKingChoou = {
    ...seedMembers[0],
    mlbbId: "1473749667",
    serverId: "6704",
  };

  const reconciled = reconcileRemoteAppState(
    {
      ...fallback,
      members: [
        staleKingChoou,
        {
          ...member,
          id: "member_boshleaf",
          username: "boshleaf",
          playerName: "boshleaf",
        },
      ],
      seasons: [],
      rpTransactions: [],
      rankHistory: [],
      pendingAccountRequests: [
        {
          id: "pending_royalknight",
          username: "royalknight",
          passwordHash: "hash",
          requestedAt: "2026-07-11T17:00:00.000Z",
        },
      ],
      authAccounts: [
        {
          id: "auth_royalknight",
          username: "royalknight",
          passwordHash: "hash",
          createdAt: "2026-07-11T17:00:00.000Z",
        },
      ],
    },
    fallback,
  );

  assert.equal(reconciled.members.length, seedMembers.length);
  assert.ok(reconciled.members.some((entry) => entry.username === "kingvoid"));
  assert.equal(
    reconciled.members.find((entry) => entry.username === "kingchoou")?.mlbbId,
    "1473749667",
  );
  assert.equal(reconciled.members.some((entry) => entry.username === "boshleaf"), false);
  assert.ok(reconciled.rpTransactions.length > 0);
  assert.ok(reconciled.rankHistory.length > 0);
  assert.equal(reconciled.seasons[0]?.id, ACTIVE_SEASON.id);
  assert.equal(reconciled.pendingAccountRequests[0]?.username, "royalknight");
  assert.equal(reconciled.authAccounts[0]?.username, "royalknight");
});
