import type { Member, ScheduleEvent } from "../types";

export type MemberFilters = {
  query?: string;
  role?: string;
  status?: string;
  team?: string;
};

const ALL = "All";
const ADMIN_TABS = new Set(["general", "members", "matches", "announcements"]);

function normalize(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function eventDateTime(event: ScheduleEvent) {
  return new Date(`${event.date}T${event.time || "00:00"}:00`).getTime();
}

export function filterMembers(members: Member[], filters: MemberFilters = {}) {
  const query = normalize(filters.query);
  const role = filters.role || ALL;
  const status = filters.status || ALL;
  const team = filters.team || ALL;

  return members.filter((member) => {
    const searchableText = [
      member.playerName,
      member.mlbbId,
      member.serverId,
      member.mainRole,
      member.secondaryRole,
      member.team,
      member.currentRank,
      member.highestRank,
      member.status,
      ...member.mainHeroes,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchableText.includes(query)) &&
      (role === ALL || member.mainRole === role || member.secondaryRole === role) &&
      (status === ALL || member.status === status) &&
      (team === ALL || member.team === team)
    );
  });
}

export function uniqueMemberValues(
  members: Member[],
  selector: (member: Member) => string | string[],
) {
  return Array.from(
    new Set(members.flatMap((member) => selector(member)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function getNextScheduledEvent(
  schedule: ScheduleEvent[],
  now = new Date(),
) {
  const currentTime = now.getTime();

  return [...schedule]
    .filter((event) => eventDateTime(event) >= currentTime)
    .sort((a, b) => eventDateTime(a) - eventDateTime(b))[0];
}

export function getAdminTabFromSearch(search: string) {
  const tab = new URLSearchParams(search).get("tab") || "general";
  return ADMIN_TABS.has(tab) ? tab : "general";
}
