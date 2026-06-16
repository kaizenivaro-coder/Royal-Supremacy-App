import type { Announcement, Member, Notification, ProfileBanner, Team } from "../types";
import { publicAsset } from "./publicAssets";

export const ADMIN_PORTAL_PASSWORD = "Toxic0303#";
export const MVP_STORAGE_VERSION = "royal-supremacy-mvp-2026-05-28-leaderboard";

export const DEFAULT_TEAM = "Unassigned";
export const TEAM_GROUPS = [
  "Royal Supremacy Team A",
  "Royal Supremacy Team B",
  "Royal Valor Team A",
  "Royal Valor Team B",
  "Unassigned",
] as const;

export type TeamGroupName = (typeof TEAM_GROUPS)[number];

function normalizeTeamId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function createDefaultTeams(createdAt = "2026-05-28T00:00:00.000Z"): Team[] {
  return TEAM_GROUPS.map((team) => ({
    id: `team_${normalizeTeamId(team)}`,
    name: team,
    createdAt,
    isDefault: true,
  }));
}

export function getActiveTeams(teams: Team[]) {
  return teams.filter((team) => !team.archivedAt);
}

export function createTeam(
  teams: Team[],
  name: string,
  isAdmin: boolean,
  now = new Date(),
) {
  if (!isAdmin) {
    return { ok: false, error: "Only Admin Portal users can create teams.", teams };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Enter a team name.", teams };
  }

  const duplicate = getActiveTeams(teams).some(
    (team) => team.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: "A team with that name already exists.", teams };
  }

  const idBase = normalizeTeamId(trimmedName) || `team_${now.getTime()}`;
  return {
    ok: true,
    teams: [
      ...teams,
      {
        id: `team_${idBase}_${now.getTime()}`,
        name: trimmedName,
        createdAt: now.toISOString(),
      },
    ],
  };
}

export function archiveTeam(
  teams: Team[],
  members: Member[],
  teamId: string,
  isAdmin: boolean,
  now = new Date(),
) {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can delete teams.",
      teams,
      members,
    };
  }

  const team = teams.find((entry) => entry.id === teamId);
  if (!team || team.archivedAt) {
    return { ok: false, error: "Team not found.", teams, members };
  }

  if (team.name === DEFAULT_TEAM) {
    return { ok: false, error: "Unassigned cannot be deleted.", teams, members };
  }

  const archivedAt = now.toISOString();
  return {
    ok: true,
    teams: teams.map((entry) =>
      entry.id === teamId ? { ...entry, archivedAt } : entry,
    ),
    members: members.map((member) =>
      member.team === team.name ? { ...member, team: DEFAULT_TEAM } : member,
    ),
  };
}

export const PROFILE_BANNERS: ProfileBanner[] = [
  { id: "chou-stun", name: "Chou STUN", src: publicAsset("banners/chou-stun.jpg") },
  { id: "tigreal-lightborn", name: "Tigreal Lightborn", src: publicAsset("banners/tigreal-lightborn.webp") },
  { id: "tigreal-golden-baron", name: "Tigreal Golden Baron", src: publicAsset("banners/tigreal-golden-baron.webp") },
  { id: "tigreal-warrior-dawn", name: "Tigreal Warrior of Dawn", src: publicAsset("banners/tigreal-warrior-dawn.webp") },
];

function isTeamGroup(team: string): team is TeamGroupName {
  return TEAM_GROUPS.includes(team as TeamGroupName);
}

export function getSafeTeamName(team: string | undefined, teams?: Team[]): string {
  const activeTeamNames: string[] = teams
    ? getActiveTeams(teams).map((entry) => entry.name)
    : [...TEAM_GROUPS];
  if (team && activeTeamNames.includes(team)) {
    return team;
  }

  return DEFAULT_TEAM;
}

export function getActiveMembers(members: Member[]) {
  return members.filter((member) => member.lifecycleStatus !== "Archived");
}

export function groupMembersByTeam(members: Member[], teams = createDefaultTeams()) {
  const groups = getActiveTeams(teams).reduce(
    (accumulator, team) => ({
      ...accumulator,
      [team.name]: [] as Member[],
    }),
    {} as Record<string, Member[]>,
  );

  members.forEach((member) => {
    const safeTeamName = getSafeTeamName(member.team, teams);
    groups[safeTeamName] = groups[safeTeamName] ?? [];
    groups[safeTeamName].push(member);
  });

  return groups;
}

export function validateAdminPortalPassword(password: string) {
  return password === ADMIN_PORTAL_PASSWORD;
}

export function assignMemberTeam(
  members: Member[],
  memberId: string,
  teamName: string,
  isAdmin: boolean,
  teams = createDefaultTeams(),
) {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can assign squad teams.",
      members,
    };
  }

  const safeTeamName = getSafeTeamName(teamName, teams);
  let didChange = false;
  const nextMembers = members.map((member) => {
    if (member.id !== memberId) {
      return member;
    }

    didChange = true;
    return { ...member, team: safeTeamName };
  });

  return {
    ok: didChange,
    error: didChange ? undefined : "Member not found.",
    members: nextMembers,
  };
}

export function archiveMember(
  members: Member[],
  memberId: string,
  isAdmin: boolean,
  reason = "Left squad",
  now = new Date(),
) {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can archive members.",
      members,
    };
  }

  let didChange = false;
  const archivedAt = now.toISOString();
  const nextMembers = members.map((member) => {
    if (member.id !== memberId) return member;

    didChange = true;
    return {
      ...member,
      lifecycleStatus: "Archived" as const,
      status: "Left",
      archivedAt,
      archivedReason: reason.trim() || "Left squad",
      team: DEFAULT_TEAM,
    };
  });

  return {
    ok: didChange,
    error: didChange ? undefined : "Member not found.",
    members: nextMembers,
  };
}

export function createOnlineNotification(
  username: string,
  now = new Date(),
): Notification {
  const actorUsername = username.trim().toLowerCase() || "someone";

  return {
    id: `notification_${now.getTime()}`,
    type: "online",
    actorUsername,
    message: `${actorUsername} is going online`,
    createdAt: now.toISOString(),
  };
}

export function getLatestAnnouncements(
  announcements: Announcement[],
  limit = 3,
) {
  return announcements
    .filter((announcement) => !announcement.deletedAt)
    .sort((first, second) => {
      const dateDelta = new Date(second.date).getTime() - new Date(first.date).getTime();
      return dateDelta || second.id.localeCompare(first.id);
    })
    .slice(0, limit);
}

function getAnnouncementUsers(users: string[] | undefined) {
  return Array.isArray(users) ? users : [];
}

function sortAnnouncementsNewestFirst(announcements: Announcement[]) {
  return [...announcements].sort((first, second) => {
    const dateDelta = new Date(second.date).getTime() - new Date(first.date).getTime();
    return dateDelta || second.id.localeCompare(first.id);
  });
}

export function getVisibleAnnouncements(
  announcements: Announcement[],
  viewerId: string,
) {
  const normalizedViewerId = viewerId.trim().toLowerCase();

  return sortAnnouncementsNewestFirst(announcements).filter((announcement) => {
    if (!announcement.deletedAt) {
      return true;
    }

    return getAnnouncementUsers(announcement.savedBy).includes(normalizedViewerId);
  });
}

export function softDeleteAnnouncement(
  announcements: Announcement[],
  announcementId: string,
  isAdmin: boolean,
  now = new Date(),
) {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can delete announcements.",
      announcements,
    };
  }

  let didChange = false;
  const deletedAt = now.toISOString();
  const nextAnnouncements = announcements.map((announcement) => {
    if (announcement.id !== announcementId) return announcement;

    didChange = true;
    return {
      ...announcement,
      deletedAt,
      deletedBy: "Admin Portal",
    };
  });

  return {
    ok: didChange,
    error: didChange ? undefined : "Announcement not found.",
    announcements: nextAnnouncements,
  };
}

export function removeAnnouncementSave(
  announcements: Announcement[],
  announcementId: string,
  viewerId: string,
) {
  const normalizedViewerId = viewerId.trim().toLowerCase();
  let didChange = false;
  const nextAnnouncements = announcements.map((announcement) => {
    if (announcement.id !== announcementId) return announcement;

    const savedBy = getAnnouncementUsers(announcement.savedBy);
    didChange = savedBy.includes(normalizedViewerId);
    return {
      ...announcement,
      savedBy: savedBy.filter((userId) => userId !== normalizedViewerId),
    };
  });

  return {
    ok: didChange,
    announcements: nextAnnouncements,
  };
}

export function updateAnnouncementComment(
  announcements: Announcement[],
  announcementId: string,
  commentId: string,
  author: string,
  message: string,
  now = new Date(),
) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return {
      ok: false,
      error: "Comment cannot be empty.",
      announcements,
    };
  }

  let didChange = false;
  const nextAnnouncements = announcements.map((announcement) => {
    if (announcement.id !== announcementId) return announcement;

    return {
      ...announcement,
      comments: (announcement.comments ?? []).map((comment) => {
        if (comment.id !== commentId || comment.author !== author) {
          return comment;
        }

        didChange = true;
        return {
          ...comment,
          message: trimmedMessage,
          editedAt: now.toISOString(),
        };
      }),
    };
  });

  return {
    ok: didChange,
    error: didChange ? undefined : "Comment not found for this user.",
    announcements: nextAnnouncements,
  };
}

export function deleteAnnouncementComment(
  announcements: Announcement[],
  announcementId: string,
  commentId: string,
  author: string,
) {
  let didChange = false;
  const nextAnnouncements = announcements.map((announcement) => {
    if (announcement.id !== announcementId) return announcement;

    return {
      ...announcement,
      comments: (announcement.comments ?? []).filter((comment) => {
        const shouldDelete = comment.id === commentId && comment.author === author;
        if (shouldDelete) didChange = true;
        return !shouldDelete;
      }),
    };
  });

  return {
    ok: didChange,
    error: didChange ? undefined : "Comment not found for this user.",
    announcements: nextAnnouncements,
  };
}

export function getProfileBanner(bannerId: string | undefined) {
  return (
    PROFILE_BANNERS.find((banner) => banner.id === bannerId) ?? PROFILE_BANNERS[0]
  );
}
