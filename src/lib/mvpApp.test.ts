import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PORTAL_PASSWORD,
  TEAM_GROUPS,
  archiveMember,
  archiveTeam,
  assignMemberTeam,
  createDefaultTeams,
  createTeam,
  createOnlineNotification,
  getActiveMembers,
  getLatestAnnouncements,
  getVisibleAnnouncements,
  groupMembersByTeam,
  removeAnnouncementSave,
  softDeleteAnnouncement,
  deleteAnnouncementComment,
  updateAnnouncementComment,
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

test("createTeam adds unique admin-created teams", () => {
  const teams = createDefaultTeams();
  const blocked = createTeam(teams, "Royal Academy", false);
  const allowed = createTeam(
    teams,
    "Royal Academy",
    true,
    new Date("2026-06-14T00:00:00.000Z"),
  );
  const duplicate = createTeam(allowed.teams, "royal academy", true);

  assert.equal(blocked.ok, false);
  assert.equal(allowed.ok, true);
  assert.equal(allowed.teams.at(-1)?.name, "Royal Academy");
  assert.equal(duplicate.ok, false);
});

test("archiveTeam moves members to Unassigned and protects Unassigned", () => {
  const teams = createDefaultTeams();
  const valorTeam = teams.find((team) => team.name === "Royal Valor Team A");
  const unassignedTeam = teams.find((team) => team.name === "Unassigned");
  assert.ok(valorTeam);
  assert.ok(unassignedTeam);

  const members = [{ ...baseMember, team: "Royal Valor Team A" }];
  const archived = archiveTeam(
    teams,
    members,
    valorTeam.id,
    true,
    new Date("2026-06-14T00:00:00.000Z"),
  );
  const protectedTeam = archiveTeam(teams, members, unassignedTeam.id, true);

  assert.equal(archived.ok, true);
  assert.equal(archived.teams.find((team) => team.id === valorTeam.id)?.archivedAt, "2026-06-14T00:00:00.000Z");
  assert.equal(archived.members[0]?.team, "Unassigned");
  assert.equal(protectedTeam.ok, false);
});

test("archiveMember preserves historical member data while hiding active member", () => {
  const result = archiveMember(
    [baseMember],
    baseMember.id,
    true,
    "Left squad",
    new Date("2026-06-14T00:00:00.000Z"),
  );

  assert.equal(result.ok, true);
  assert.equal(result.members[0]?.lifecycleStatus, "Archived");
  assert.equal(result.members[0]?.status, "Left");
  assert.equal(result.members[0]?.archivedAt, "2026-06-14T00:00:00.000Z");
  assert.equal(result.members[0]?.archivedReason, "Left squad");
  assert.deepEqual(getActiveMembers(result.members), []);
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

test("deleted announcements remain visible only for users who saved them", () => {
  const announcements = [
    {
      id: "ann_001",
      title: "Saved",
      message: "Saved copy",
      priority: "Normal",
      postedBy: "Royal Supremacy",
      date: "2026-05-11",
      savedBy: ["kingchoou"],
    },
  ] satisfies Announcement[];

  const deleted = softDeleteAnnouncement(
    announcements,
    "ann_001",
    true,
    new Date("2026-05-12T09:00:00.000Z"),
  );

  assert.equal(deleted.ok, true);
  assert.equal(deleted.announcements[0].deletedAt, "2026-05-12T09:00:00.000Z");
  assert.deepEqual(
    getVisibleAnnouncements(deleted.announcements, "other_user").map(
      (announcement) => announcement.id,
    ),
    [],
  );
  assert.deepEqual(
    getVisibleAnnouncements(deleted.announcements, "kingchoou").map(
      (announcement) => announcement.id,
    ),
    ["ann_001"],
  );

  const unsaved = removeAnnouncementSave(
    deleted.announcements,
    "ann_001",
    "kingchoou",
  );

  assert.deepEqual(
    getVisibleAnnouncements(unsaved.announcements, "kingchoou").map(
      (announcement) => announcement.id,
    ),
    [],
  );
});

test("announcement comments can be edited and deleted only by their author", () => {
  const announcements = [
    {
      id: "ann_001",
      title: "Commented",
      message: "Message",
      priority: "Normal",
      postedBy: "Royal Supremacy",
      date: "2026-05-11",
      comments: [
        {
          id: "comment_001",
          author: "kingchoou",
          message: "hello",
          createdAt: "2026-05-11T09:00:00.000Z",
        },
      ],
    },
  ] satisfies Announcement[];

  const rejectedEdit = updateAnnouncementComment(
    announcements,
    "ann_001",
    "comment_001",
    "other_user",
    "changed",
  );
  assert.equal(rejectedEdit.ok, false);
  assert.equal(rejectedEdit.announcements[0].comments?.[0]?.message, "hello");

  const edited = updateAnnouncementComment(
    announcements,
    "ann_001",
    "comment_001",
    "kingchoou",
    "changed",
  );
  assert.equal(edited.ok, true);
  assert.equal(edited.announcements[0].comments?.[0]?.message, "changed");

  const rejectedDelete = deleteAnnouncementComment(
    edited.announcements,
    "ann_001",
    "comment_001",
    "other_user",
  );
  assert.equal(rejectedDelete.ok, false);
  assert.equal(rejectedDelete.announcements[0].comments?.length, 1);

  const deleted = deleteAnnouncementComment(
    edited.announcements,
    "ann_001",
    "comment_001",
    "kingchoou",
  );
  assert.equal(deleted.ok, true);
  assert.deepEqual(deleted.announcements[0].comments, []);
});
