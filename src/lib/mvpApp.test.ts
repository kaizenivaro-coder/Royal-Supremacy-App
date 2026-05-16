import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PORTAL_PASSWORD,
  TEAM_GROUPS,
  assignMemberTeam,
  createOnlineNotification,
  getLatestAnnouncements,
  groupMembersByTeam,
  validateAdminPortalPassword,
} from "./mvpApp.ts";
import type { Announcement, Member } from "../types";

const baseMember = {
  id: "member_001",
  playerName: "King Choou",
  username: "kingchoou",
  authUserId: "auth_kingchoou",
  mlbbId: "123",
  serverId: "1",
  mainRole: "EXP",
  secondaryRole: "Roam",
  mainHeroes: ["Chou"],
  currentRank: "Mythical Honor",
  highestRank: "Mythical Glory",
  team: "Unassigned",
  status: "Active",
  bannerId: "chou-stun",
} satisfies Member;

test("groupMembersByTeam creates the five fixed MVP team buckets", () => {
  const members = [
    baseMember,
    { ...baseMember, id: "member_002", username: "valor", team: "Royal Valor Team A" },
    { ...baseMember, id: "member_003", username: "legacy", team: "Old Team Name" },
  ];

  const grouped = groupMembersByTeam(members);

  assert.deepEqual(Object.keys(grouped), TEAM_GROUPS);
  assert.deepEqual(
    grouped["Royal Valor Team A"].map((member) => member.username),
    ["valor"],
  );
  assert.deepEqual(
    grouped.Unassigned.map((member) => member.username),
    ["kingchoou", "legacy"],
  );
});

test("assignMemberTeam only changes team assignment for admins", () => {
  const blocked = assignMemberTeam([baseMember], baseMember.id, "Royal Supremacy Team A", false);
  const allowed = assignMemberTeam([baseMember], baseMember.id, "Royal Supremacy Team A", true);

  assert.equal(blocked.ok, false);
  assert.equal(blocked.members[0]?.team, "Unassigned");
  assert.equal(allowed.ok, true);
  assert.equal(allowed.members[0]?.team, "Royal Supremacy Team A");
});

test("validateAdminPortalPassword accepts only the MVP admin password", () => {
  assert.equal(validateAdminPortalPassword(ADMIN_PORTAL_PASSWORD), true);
  assert.equal(validateAdminPortalPassword("wrong-password"), false);
});

test("createOnlineNotification builds a local going-online notification", () => {
  const notification = createOnlineNotification("kingchoou", new Date("2026-05-16T09:30:00.000Z"));

  assert.equal(notification.message, "kingchoou is going online");
  assert.equal(notification.type, "online");
  assert.equal(notification.createdAt, "2026-05-16T09:30:00.000Z");
});

test("getLatestAnnouncements returns the newest three announcements", () => {
  const announcements = [
    { id: "old", title: "Old", message: "Old", priority: "Normal", postedBy: "Admin", date: "2026-05-01" },
    { id: "third", title: "Third", message: "Third", priority: "Normal", postedBy: "Admin", date: "2026-05-03" },
    { id: "first", title: "First", message: "First", priority: "Urgent", postedBy: "Admin", date: "2026-05-05" },
    { id: "second", title: "Second", message: "Second", priority: "Important", postedBy: "Admin", date: "2026-05-04" },
  ] satisfies Announcement[];

  assert.deepEqual(
    getLatestAnnouncements(announcements).map((announcement) => announcement.id),
    ["first", "second", "third"],
  );
});
