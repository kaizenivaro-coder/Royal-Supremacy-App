import type { Announcement, Member, Notification, ProfileBanner } from "../types";

export const ADMIN_PORTAL_PASSWORD = "Toxic0303#";
export const MVP_STORAGE_VERSION = "royal-supremacy-mvp-2026-05-16";

export const DEFAULT_TEAM = "Unassigned";
export const TEAM_GROUPS = [
  "Royal Supremacy Team A",
  "Royal Supremacy Team B",
  "Royal Valor Team A",
  "Royal Valor Team B",
  "Unassigned",
] as const;

export type TeamGroupName = (typeof TEAM_GROUPS)[number];

export const PROFILE_BANNERS: ProfileBanner[] = [
  { id: "chou-stun", name: "Chou STUN", src: "/banners/chou-stun.jpg" },
  { id: "tigreal-lightborn", name: "Tigreal Lightborn", src: "/banners/tigreal-lightborn.webp" },
  { id: "tigreal-golden-baron", name: "Tigreal Golden Baron", src: "/banners/tigreal-golden-baron.webp" },
  { id: "tigreal-warrior-dawn", name: "Tigreal Warrior of Dawn", src: "/banners/tigreal-warrior-dawn.webp" },
];

function isTeamGroup(team: string): team is TeamGroupName {
  return TEAM_GROUPS.includes(team as TeamGroupName);
}

export function getSafeTeamName(team: string | undefined): TeamGroupName {
  if (team && isTeamGroup(team)) {
    return team;
  }

  return DEFAULT_TEAM;
}

export function groupMembersByTeam(members: Member[]) {
  const groups = TEAM_GROUPS.reduce(
    (accumulator, team) => ({
      ...accumulator,
      [team]: [] as Member[],
    }),
    {} as Record<TeamGroupName, Member[]>,
  );

  members.forEach((member) => {
    groups[getSafeTeamName(member.team)].push(member);
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
) {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can assign squad teams.",
      members,
    };
  }

  const safeTeamName = getSafeTeamName(teamName);
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
  return [...announcements]
    .sort((first, second) => {
      const dateDelta = new Date(second.date).getTime() - new Date(first.date).getTime();
      return dateDelta || second.id.localeCompare(first.id);
    })
    .slice(0, limit);
}

export function getProfileBanner(bannerId: string | undefined) {
  return (
    PROFILE_BANNERS.find((banner) => banner.id === bannerId) ?? PROFILE_BANNERS[0]
  );
}
