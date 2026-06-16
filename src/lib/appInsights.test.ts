import assert from "node:assert/strict";
import test from "node:test";
import { getAdminTabFromSearch, filterMembers } from "./appInsights.ts";
import type { Member } from "../types";

const members = [
  {
    id: "member_001",
    username: "kingchoou",
    playerName: "King Choou",
    mlbbId: "123",
    serverId: "1",
    mainRole: "EXP Lane",
    secondaryRole: "Roam",
    mainHeroes: ["Chou"],
    currentRank: "Mythical Honor",
    highestRank: "Mythical Glory",
    team: "Unassigned",
    status: "Active",
    bannerId: "chou-stun",
  },
  {
    id: "member_002",
    username: "shadow",
    playerName: "Shadow",
    mlbbId: "456",
    serverId: "2",
    mainRole: "Jungle",
    secondaryRole: "EXP Lane",
    mainHeroes: ["Ling"],
    currentRank: "Mythic",
    highestRank: "Mythical Honor",
    team: "Royal Valor Team A",
    status: "Trial",
    bannerId: "tigreal-lightborn",
  },
] satisfies Member[];

test("filterMembers combines query, status, role, and team filters", () => {
  assert.deepEqual(
    filterMembers(members, {
      query: "shadow",
      role: "Jungle",
      status: "Trial",
      team: "Royal Valor Team A",
    }).map((member) => member.playerName),
    ["Shadow"],
  );
});

test("filterMembers searches ranks, heroes, ids, and secondary roles", () => {
  assert.deepEqual(
    filterMembers(members, { query: "roam" }).map((member) => member.playerName),
    ["King Choou"],
  );
  assert.deepEqual(
    filterMembers(members, { query: "ling" }).map((member) => member.playerName),
    ["Shadow"],
  );
});

test("getAdminTabFromSearch only accepts supported MVP admin tabs", () => {
  assert.equal(getAdminTabFromSearch("?tab=members"), "members");
  assert.equal(getAdminTabFromSearch("?tab=rank-command"), "rank-command");
  assert.equal(getAdminTabFromSearch("?tab=matches"), "general");
  assert.equal(getAdminTabFromSearch("?tab=unknown"), "general");
  assert.equal(getAdminTabFromSearch(""), "general");
});
