import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRemoteAppState } from "./supabaseAppState.ts";
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
  assert.deepEqual(state?.tryouts, []);
  assert.deepEqual(state?.notifications, []);
  assert.equal(state?.squadLogoSrc, "");
});

test("normalizeRemoteAppState rejects data without a members list", () => {
  assert.equal(normalizeRemoteAppState({ announcements: [] }), null);
  assert.equal(normalizeRemoteAppState(null), null);
});
