import type {
  Announcement,
  Member,
  Notification,
  RankHistory,
  RpTransaction,
  Season,
  StrategyPlacement,
  Team,
} from "../types";
import type { LocalAuthAccount, PendingAccountRequest } from "./localAuth";
import { LEGACY_SEED_AUTH_ACCOUNT_IDS } from "../data/leaderboardSeed";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export const SUPABASE_APP_STATE_ID = "royal-supremacy";

export type RemoteAppState = {
  members: Member[];
  announcements: Announcement[];
  notifications: Notification[];
  squadLogoSrc: string;
  seasons: Season[];
  teams: Team[];
  rpTransactions: RpTransaction[];
  rankHistory: RankHistory[];
  publicStrategyPlacements: StrategyPlacement[];
  strategyEditorUsernames: string[];
  pendingAccountRequests: PendingAccountRequest[];
  authAccounts: LocalAuthAccount[];
};

function getMemberIdentity(member: Member) {
  return [
    member.id,
    member.username,
    member.normalizedName,
    member.playerName?.toLowerCase().replace(/[^a-z0-9]+/g, ""),
  ].filter(Boolean);
}

function findRemoteMember(seedMember: Member, remoteMembers: Member[]) {
  const seedIdentities = new Set(getMemberIdentity(seedMember));
  return remoteMembers.find((member) =>
    getMemberIdentity(member).some((identity) => seedIdentities.has(identity)),
  );
}

function mergeSeedRoster(remoteMembers: Member[], fallbackMembers: Member[]) {
  const seedMatches = fallbackMembers.filter((member) =>
    findRemoteMember(member, remoteMembers),
  ).length;
  const remoteIsStalePartialRoster =
    fallbackMembers.length > 0 &&
    seedMatches < Math.min(5, Math.ceil(fallbackMembers.length * 0.25));

  if (remoteIsStalePartialRoster) {
    return fallbackMembers.map((seedMember) => {
      const remoteMember = findRemoteMember(seedMember, remoteMembers);
      return remoteMember
        ? {
            ...seedMember,
            ...remoteMember,
            id: seedMember.id,
            username: seedMember.username,
            normalizedName: seedMember.normalizedName,
          }
        : seedMember;
    });
  }

  const mergedMembers = [...remoteMembers];
  fallbackMembers.forEach((seedMember) => {
    if (!findRemoteMember(seedMember, mergedMembers)) {
      mergedMembers.push(seedMember);
    }
  });
  return mergedMembers;
}

function mergeById<T extends { id: string }>(remoteItems: T[], fallbackItems: T[]) {
  const mergedItems = [...remoteItems];
  const remoteIds = new Set(remoteItems.map((item) => item.id));

  fallbackItems.forEach((fallbackItem) => {
    if (!remoteIds.has(fallbackItem.id)) {
      mergedItems.push(fallbackItem);
    }
  });

  return mergedItems;
}

function clearLegacySeedAuthLinks(members: Member[]) {
  const legacySeedIds = new Set(LEGACY_SEED_AUTH_ACCOUNT_IDS);
  return members.map((member) =>
    member.authUserId && legacySeedIds.has(member.authUserId)
      ? { ...member, authUserId: undefined }
      : member,
  );
}

export function reconcileRemoteAppState(
  remoteState: RemoteAppState,
  fallbackState: RemoteAppState,
): RemoteAppState {
  return {
    members: clearLegacySeedAuthLinks(mergeSeedRoster(remoteState.members, fallbackState.members)),
    announcements: mergeById(remoteState.announcements, fallbackState.announcements),
    notifications: remoteState.notifications,
    squadLogoSrc: remoteState.squadLogoSrc || fallbackState.squadLogoSrc,
    seasons: mergeById(remoteState.seasons, fallbackState.seasons),
    teams: mergeById(remoteState.teams, fallbackState.teams),
    rpTransactions: mergeById(
      remoteState.rpTransactions,
      fallbackState.rpTransactions,
    ),
    rankHistory: mergeById(remoteState.rankHistory, fallbackState.rankHistory),
    publicStrategyPlacements: remoteState.publicStrategyPlacements,
    strategyEditorUsernames: remoteState.strategyEditorUsernames,
    pendingAccountRequests: remoteState.pendingAccountRequests,
    authAccounts: mergeById(remoteState.authAccounts, fallbackState.authAccounts),
  };
}

export function normalizeRemoteAppState(value: unknown): RemoteAppState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<RemoteAppState>;
  if (!Array.isArray(data.members)) {
    return null;
  }

  return {
    members: data.members,
    announcements: Array.isArray(data.announcements) ? data.announcements : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    squadLogoSrc: typeof data.squadLogoSrc === "string" ? data.squadLogoSrc : "",
    seasons: Array.isArray(data.seasons) ? data.seasons : [],
    teams: Array.isArray(data.teams) ? data.teams : [],
    rpTransactions: Array.isArray(data.rpTransactions) ? data.rpTransactions : [],
    rankHistory: Array.isArray(data.rankHistory) ? data.rankHistory : [],
    publicStrategyPlacements: Array.isArray(data.publicStrategyPlacements)
      ? data.publicStrategyPlacements
      : [],
    strategyEditorUsernames: Array.isArray(data.strategyEditorUsernames)
      ? data.strategyEditorUsernames.filter((username): username is string => typeof username === "string")
      : [],
    pendingAccountRequests: Array.isArray(data.pendingAccountRequests)
      ? data.pendingAccountRequests.filter(
          (request): request is PendingAccountRequest =>
            Boolean(request) &&
            typeof request === "object" &&
            typeof (request as PendingAccountRequest).id === "string" &&
            typeof (request as PendingAccountRequest).username === "string" &&
            typeof (request as PendingAccountRequest).passwordHash === "string" &&
            typeof (request as PendingAccountRequest).requestedAt === "string",
        )
      : [],
    authAccounts: Array.isArray(data.authAccounts)
      ? data.authAccounts.filter(
          (account): account is LocalAuthAccount =>
            Boolean(account) &&
            typeof account === "object" &&
            typeof (account as LocalAuthAccount).id === "string" &&
            typeof (account as LocalAuthAccount).username === "string" &&
            typeof (account as LocalAuthAccount).passwordHash === "string" &&
            typeof (account as LocalAuthAccount).createdAt === "string",
        )
      : [],
  };
}

export async function loadRemoteAppState() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("mvp_app_state")
    .select("data")
    .eq("id", SUPABASE_APP_STATE_ID)
    .maybeSingle();

  if (error) {
    console.warn("Supabase app state load failed", error.message);
    return null;
  }

  return normalizeRemoteAppState(data?.data);
}

export async function saveRemoteAppState(state: RemoteAppState) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("mvp_app_state").upsert({
    id: SUPABASE_APP_STATE_ID,
    data: state,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Supabase app state save failed", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
