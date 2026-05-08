import assert from "node:assert/strict";
import test from "node:test";
import { getAdminTabFromSearch, filterMembers, getNextScheduledEvent } from "./appInsights.ts";
import type { Member, ScheduleEvent } from "../types";

const members = [
  {
    id: "member_001",
    playerName: "King Choou",
    mlbbId: "123",
    serverId: "1",
    mainRole: "EXP",
    secondaryRole: "Roam",
    mainHeroes: ["Chou"],
    currentRank: "Mythical Honor",
    highestRank: "Mythical Glory",
    team: "Team Sovereign",
    status: "Active",
    royalPoints: 240,
    attendanceRate: 92,
  },
  {
    id: "member_002",
    playerName: "Shadow",
    mlbbId: "456",
    serverId: "2",
    mainRole: "Jungle",
    secondaryRole: "EXP",
    mainHeroes: ["Ling"],
    currentRank: "Mythic",
    highestRank: "Mythical Honor",
    team: "Royal Valor",
    status: "Trial",
    royalPoints: 120,
    attendanceRate: 70,
  },
] satisfies Member[];

const schedule = [
  {
    id: "past",
    title: "Past Briefing",
    type: "Team Meeting",
    date: "2026-05-07",
    time: "20:00",
    team: "Team Sovereign",
    description: "Already finished.",
    attendance: {},
  },
  {
    id: "next",
    title: "Friday Ranked Push",
    type: "Ranked Push",
    date: "2026-05-08",
    time: "20:00",
    team: "Team Sovereign",
    description: "Next operation.",
    attendance: {},
  },
  {
    id: "later",
    title: "Sunday Scrim",
    type: "Scrim",
    date: "2026-05-10",
    time: "19:00",
    team: "Royal Valor",
    description: "Later operation.",
    attendance: {},
  },
] satisfies ScheduleEvent[];

test("filterMembers combines query, status, role, and team filters", () => {
  assert.deepEqual(
    filterMembers(members, {
      query: "shadow",
      role: "Jungle",
      status: "Trial",
      team: "Royal Valor",
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

test("getNextScheduledEvent returns the nearest upcoming event of any type", () => {
  assert.equal(
    getNextScheduledEvent(schedule, new Date("2026-05-08T09:00:00"))?.title,
    "Friday Ranked Push",
  );
});

test("getAdminTabFromSearch only accepts supported admin tabs", () => {
  assert.equal(getAdminTabFromSearch("?tab=matches"), "matches");
  assert.equal(getAdminTabFromSearch("?tab=unknown"), "general");
  assert.equal(getAdminTabFromSearch(""), "general");
});
