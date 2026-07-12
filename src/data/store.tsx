import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type {
  Announcement,
  Member,
  Notification,
  RankHistory,
  RankStatus,
  RpSourceType,
  RpTransaction,
  Season,
  StrategyPlacement,
  Team,
} from "../types";
import { mockAnnouncements, mockMembers } from "./mock";
import {
  ACTIVE_SEASON,
  LEGACY_SEED_AUTH_ACCOUNT_IDS,
  OWNER_USERNAME,
  SEED_AUTH_CREDENTIALS,
  createSeedMembers,
  createSeedRankHistory,
  createSeedRpTransactions,
} from "./leaderboardSeed";
import {
  AuthUser,
  approvePendingAccountRequest,
  changeAccountPassword,
  connectAccountEmail,
  createPendingAccountRequest,
  ensureLocalAccount,
  LocalAuthAccount,
  PendingAccountRequest,
  rejectPendingAccountRequest,
  verifyLocalCredentials,
} from "../lib/localAuth";
import {
  DEFAULT_TEAM,
  MVP_STORAGE_VERSION,
  archiveMember as archiveMemberData,
  archiveTeam as archiveTeamData,
  assignMemberTeam as assignMemberTeamData,
  createDefaultTeams,
  createTeam as createTeamData,
  createOnlineNotification,
} from "../lib/mvpApp";
import {
  applyMythicRankUpdates,
  getValidRankStatus,
  resetSeasonForMembers,
} from "../lib/leaderboard";
import {
  RemoteAppState,
  loadRemoteAppState,
  reconcileRemoteAppState,
  saveRemoteAppState,
} from "../lib/supabaseAppState";
import { isSupabaseConfigured } from "../lib/supabaseClient";

interface AppState {
  members: Member[];
  announcements: Announcement[];
  notifications: Notification[];
  squadLogoSrc: string;
  seasons: Season[];
  teams: Team[];
  rpTransactions: RpTransaction[];
  rankHistory: RankHistory[];
  publicStrategyPlacements: StrategyPlacement[];
  privateStrategyPlacementsByUser: Record<string, StrategyPlacement[]>;
  strategyEditorUsernames: string[];
  pendingAccountRequests: PendingAccountRequest[];
  isAdmin: boolean;
  authUser: AuthUser | null;
}

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AssignTeamResult {
  ok: boolean;
  error?: string;
}

interface AppContextType extends AppState {
  approvedAccountCount: number;
  setMembers: (members: Member[]) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setSquadLogoSrc: (src: string) => void;
  setTeams: (teams: Team[]) => void;
  setRpTransactions: (transactions: RpTransaction[]) => void;
  setRankHistory: (rankHistory: RankHistory[]) => void;
  setPublicStrategyPlacements: (placements: StrategyPlacement[]) => void;
  setPrivateStrategyPlacements: (username: string, placements: StrategyPlacement[]) => void;
  setStrategyEditorUsernames: (usernames: string[]) => void;
  setPendingAccountRequests: (requests: PendingAccountRequest[]) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  login: (identifier: string, password: string) => Promise<AuthActionResult>;
  signup: (identifier: string, password: string) => Promise<AuthActionResult>;
  approveAccountRequest: (requestId: string) => AuthActionResult;
  rejectAccountRequest: (requestId: string) => AuthActionResult;
  connectEmail: (email: string) => Promise<AuthActionResult>;
  changePassword: (password: string) => Promise<AuthActionResult>;
  notifyTeamOnline: () => Notification;
  assignMemberTeam: (memberId: string, teamName: string) => AssignTeamResult;
  createTeam: (name: string) => AssignTeamResult;
  archiveTeam: (teamId: string) => AssignTeamResult;
  archiveMember: (memberId: string, reason?: string) => AssignTeamResult;
  resetSeason: () => AssignTeamResult;
  updateMythicRanks: (
    updates: { memberId: string; rankStatus: RankStatus | string; stars: number }[],
  ) => AssignTeamResult;
  addRpTransaction: (input: {
    memberId: string;
    sourceType: RpSourceType;
    amount: number;
    description: string;
    occurredAt?: string;
  }) => AssignTeamResult;
  logout: () => void;
  resetData: () => void;
}

const defaultState: AppState = {
  members: mockMembers,
  announcements: mockAnnouncements,
  notifications: [],
  squadLogoSrc: "",
  seasons: [ACTIVE_SEASON],
  teams: createDefaultTeams(),
  rpTransactions: createSeedRpTransactions(),
  rankHistory: createSeedRankHistory(),
  publicStrategyPlacements: [],
  privateStrategyPlacementsByUser: {},
  strategyEditorUsernames: [],
  pendingAccountRequests: [],
  isAdmin: false,
  authUser: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const activeDataKeys = [
  "members",
  "announcements",
  "notifications",
  "squadLogoSrc",
  "seasons",
  "teams",
  "rpTransactions",
  "rankHistory",
  "publicStrategyPlacements",
  "privateStrategyPlacementsByUser",
  "strategyEditorUsernames",
  "pendingAccountRequests",
  "isAdmin",
];

export const RETIRED_STORAGE_KEYS = ["schedule", "matches", "points", "tryouts"];

function storageKey(key: string) {
  return `royal_supremacy_${key}`;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(storageKey(key));
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
}

export function shouldSeedMvpAccounts() {
  try {
    return localStorage.getItem(storageKey("disable_seed_accounts")) !== "true";
  } catch {
    return true;
  }
}

function pruneLegacySeedAuthAccounts(accounts: LocalAuthAccount[]) {
  const legacySeedIds = new Set(LEGACY_SEED_AUTH_ACCOUNT_IDS);
  const filteredAccounts = accounts.filter((account) => !legacySeedIds.has(account.id));
  return filteredAccounts.length === accounts.length ? accounts : filteredAccounts;
}

function pruneLegacySeedAuthStorage() {
  try {
    const currentAccounts = readStorage<LocalAuthAccount[]>("auth_accounts", []);
    const nextAccounts = pruneLegacySeedAuthAccounts(currentAccounts);
    if (nextAccounts.length !== currentAccounts.length) {
      writeStorage("auth_accounts", nextAccounts);
    }

    const authSession = readStorage<AuthUser | null>("auth_session", null);
    if (authSession && LEGACY_SEED_AUTH_ACCOUNT_IDS.includes(authSession.id)) {
      localStorage.removeItem(storageKey("auth_session"));
    }
  } catch {
    // Local storage can be unavailable in private contexts; the in-memory defaults still work.
  }
}

function consumeLocalAccountResetRequest() {
  try {
    const key = storageKey("disable_seed_accounts");
    if (localStorage.getItem(key) !== "true") return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function writeAppStateSnapshot(state: RemoteAppState) {
  writeStorage("members", state.members);
  writeStorage("announcements", state.announcements);
  writeStorage("notifications", state.notifications);
  writeStorage("squadLogoSrc", state.squadLogoSrc);
  writeStorage("seasons", state.seasons);
  writeStorage("teams", state.teams);
  writeStorage("rpTransactions", state.rpTransactions);
  writeStorage("rankHistory", state.rankHistory);
  writeStorage("publicStrategyPlacements", state.publicStrategyPlacements);
  writeStorage("strategyEditorUsernames", state.strategyEditorUsernames);
  writeStorage("pendingAccountRequests", state.pendingAccountRequests);
  writeStorage("auth_accounts", state.authAccounts);
}

function createFallbackAppState(
  authUser: AuthUser | null,
  authAccounts: LocalAuthAccount[] = readStorage("auth_accounts", []),
): RemoteAppState {
  return {
    members: getInitialMembers(authUser),
    announcements: defaultState.announcements,
    notifications: defaultState.notifications,
    squadLogoSrc: readStorage("squadLogoSrc", defaultState.squadLogoSrc),
    seasons: defaultState.seasons,
    teams: defaultState.teams,
    rpTransactions: defaultState.rpTransactions,
    rankHistory: defaultState.rankHistory,
    publicStrategyPlacements: defaultState.publicStrategyPlacements,
    strategyEditorUsernames: defaultState.strategyEditorUsernames,
    pendingAccountRequests: readStorage(
      "pendingAccountRequests",
      defaultState.pendingAccountRequests,
    ),
    authAccounts,
  };
}

function createMemberForAuthUser(user: AuthUser): Member {
  return {
    ...mockMembers[0],
    id: `member_${user.id}`,
    username: user.username,
    authUserId: user.id,
    playerName: user.username === "kingchoou" ? "King Choou" : user.username,
    team: DEFAULT_TEAM,
    bannerId: "chou-stun",
  };
}

function ensureAuthUserInRoster(members: Member[], authUser: AuthUser | null) {
  if (!authUser) {
    return members;
  }

  let didLink = false;
  const linkedMembers = members.map((member) => {
    if (member.username !== authUser.username) {
      return member;
    }

    didLink = true;
    return { ...member, authUserId: authUser.id };
  });

  if (didLink) {
    return linkedMembers;
  }

  return [...linkedMembers, createMemberForAuthUser(authUser)];
}

function getInitialMembers(authUser: AuthUser | null): Member[] {
  return ensureAuthUserInRoster(createSeedMembers(), authUser);
}

function runMvpMigration() {
  try {
    const rawSchemaVersion = localStorage.getItem(storageKey("schema_version"));
    const storedSchemaVersion =
      rawSchemaVersion === MVP_STORAGE_VERSION
        ? rawSchemaVersion
        : readStorage<string | null>("schema_version", null);

    if (storedSchemaVersion === MVP_STORAGE_VERSION) {
      return;
    }

    const authUser = readStorage<AuthUser | null>("auth_session", null);
    const squadLogoSrc = readStorage<string>("squadLogoSrc", defaultState.squadLogoSrc);
    RETIRED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(storageKey(key)));
    localStorage.removeItem(storageKey("isAdmin"));
    writeStorage("members", getInitialMembers(authUser));
    writeStorage("notifications", []);
    writeStorage("seasons", defaultState.seasons);
    writeStorage("teams", defaultState.teams);
    writeStorage("rpTransactions", defaultState.rpTransactions);
    writeStorage("rankHistory", defaultState.rankHistory);
    writeStorage("pendingAccountRequests", defaultState.pendingAccountRequests);
    writeStorage("squadLogoSrc", squadLogoSrc);
    writeStorage("schema_version", MVP_STORAGE_VERSION);
  } catch {
    // Local storage can be unavailable in private contexts; the in-memory defaults still work.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  runMvpMigration();
  pruneLegacySeedAuthStorage();
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const [authAccounts, setAuthAccountsState] = useState<LocalAuthAccount[]>(
    readStorage("auth_accounts", []),
  );
  const [authUser, setAuthUserState] = useState<AuthUser | null>(
    readStorage("auth_session", defaultState.authUser),
  );
  const localFallbackState = createFallbackAppState(authUser, authAccounts);
  const initialLocalAppState = reconcileRemoteAppState(
    {
      members: readStorage("members", localFallbackState.members),
      announcements: readStorage("announcements", localFallbackState.announcements),
      notifications: readStorage("notifications", localFallbackState.notifications),
      squadLogoSrc: readStorage("squadLogoSrc", localFallbackState.squadLogoSrc),
      seasons: readStorage("seasons", localFallbackState.seasons),
      teams: readStorage("teams", localFallbackState.teams),
      rpTransactions: readStorage("rpTransactions", localFallbackState.rpTransactions),
      rankHistory: readStorage("rankHistory", localFallbackState.rankHistory),
      publicStrategyPlacements: readStorage(
        "publicStrategyPlacements",
        localFallbackState.publicStrategyPlacements,
      ),
      strategyEditorUsernames: readStorage(
        "strategyEditorUsernames",
        localFallbackState.strategyEditorUsernames,
      ),
      pendingAccountRequests: readStorage(
        "pendingAccountRequests",
        localFallbackState.pendingAccountRequests,
      ),
      authAccounts,
    },
    localFallbackState,
  );
  const [members, setMembersState] = useState<Member[]>(
    initialLocalAppState.members,
  );
  const [announcements, setAnnouncementsState] = useState<Announcement[]>(
    initialLocalAppState.announcements,
  );
  const [notifications, setNotificationsState] = useState<Notification[]>(
    initialLocalAppState.notifications,
  );
  const [squadLogoSrc, setSquadLogoSrcState] = useState<string>(
    initialLocalAppState.squadLogoSrc,
  );
  const [seasons, setSeasonsState] = useState<Season[]>(
    initialLocalAppState.seasons,
  );
  const [teams, setTeamsState] = useState<Team[]>(
    initialLocalAppState.teams,
  );
  const [rpTransactions, setRpTransactionsState] = useState<RpTransaction[]>(
    initialLocalAppState.rpTransactions,
  );
  const [rankHistory, setRankHistoryState] = useState<RankHistory[]>(
    initialLocalAppState.rankHistory,
  );
  const [publicStrategyPlacements, setPublicStrategyPlacementsState] = useState<StrategyPlacement[]>(
    initialLocalAppState.publicStrategyPlacements,
  );
  const [privateStrategyPlacementsByUser, setPrivateStrategyPlacementsByUserState] = useState<Record<string, StrategyPlacement[]>>(
    readStorage("privateStrategyPlacementsByUser", {}),
  );
  const [strategyEditorUsernames, setStrategyEditorUsernamesState] = useState<string[]>(
    initialLocalAppState.strategyEditorUsernames,
  );
  const [pendingAccountRequests, setPendingAccountRequestsState] = useState<PendingAccountRequest[]>(
    initialLocalAppState.pendingAccountRequests,
  );
  const [isAdmin, setIsAdminState] = useState<boolean>(
    readStorage("isAdmin", defaultState.isAdmin),
  );
  const [isRemoteHydrated, setIsRemoteHydrated] = useState(!isSupabaseConfigured);

  useEffect(() => {
    let ignore = false;

    async function hydrateRemoteState() {
      const remoteState = await loadRemoteAppState();
      if (ignore) return;

      if (remoteState) {
        const hydratedState = reconcileRemoteAppState(
          remoteState,
          createFallbackAppState(authUser, authAccounts),
        );
        setAuthAccountsState(hydratedState.authAccounts);
        setMembersState(hydratedState.members);
        setAnnouncementsState(hydratedState.announcements);
        setNotificationsState(hydratedState.notifications);
        setSquadLogoSrcState(hydratedState.squadLogoSrc);
        setSeasonsState(hydratedState.seasons);
        setTeamsState(hydratedState.teams);
        setRpTransactionsState(hydratedState.rpTransactions);
        setRankHistoryState(hydratedState.rankHistory);
        setPublicStrategyPlacementsState(hydratedState.publicStrategyPlacements);
        setStrategyEditorUsernamesState(hydratedState.strategyEditorUsernames);
        setPendingAccountRequestsState(hydratedState.pendingAccountRequests);
        writeAppStateSnapshot(hydratedState);
      }

      setIsRemoteHydrated(true);
    }

    if (isSupabaseConfigured) {
      void hydrateRemoteState();
    }

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isRemoteHydrated || !isSupabaseConfigured) {
      return undefined;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveRemoteAppState({
        members,
        announcements,
        notifications,
        squadLogoSrc,
        seasons,
        teams,
        rpTransactions,
        rankHistory,
        publicStrategyPlacements,
        strategyEditorUsernames,
        pendingAccountRequests,
        authAccounts,
      });
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    announcements,
    isRemoteHydrated,
    members,
    notifications,
    rankHistory,
    pendingAccountRequests,
    publicStrategyPlacements,
    rpTransactions,
    seasons,
    squadLogoSrc,
    teams,
    strategyEditorUsernames,
    authAccounts,
  ]);

  const setMembers = (nextMembers: Member[]) => {
    setMembersState(nextMembers);
    writeStorage("members", nextMembers);
  };

  const setAnnouncements = (nextAnnouncements: Announcement[]) => {
    setAnnouncementsState(nextAnnouncements);
    writeStorage("announcements", nextAnnouncements);
  };

  const setNotifications = (nextNotifications: Notification[]) => {
    setNotificationsState(nextNotifications);
    writeStorage("notifications", nextNotifications);
  };

  const setSquadLogoSrc = (src: string) => {
    setSquadLogoSrcState(src);
    writeStorage("squadLogoSrc", src);
  };

  const setTeams = (nextTeams: Team[]) => {
    setTeamsState(nextTeams);
    writeStorage("teams", nextTeams);
  };

  const setRpTransactions = (nextTransactions: RpTransaction[]) => {
    setRpTransactionsState(nextTransactions);
    writeStorage("rpTransactions", nextTransactions);
  };

  const setRankHistory = (nextRankHistory: RankHistory[]) => {
    setRankHistoryState(nextRankHistory);
    writeStorage("rankHistory", nextRankHistory);
  };

  const setPublicStrategyPlacements = (placements: StrategyPlacement[]) => {
    setPublicStrategyPlacementsState(placements);
    writeStorage("publicStrategyPlacements", placements);
  };

  const setPrivateStrategyPlacements = (username: string, placements: StrategyPlacement[]) => {
    const normalizedUsername = username.trim().toLowerCase();
    setPrivateStrategyPlacementsByUserState((current) => {
      const next = { ...current, [normalizedUsername]: placements };
      writeStorage("privateStrategyPlacementsByUser", next);
      return next;
    });
  };

  const setStrategyEditorUsernames = (usernames: string[]) => {
    setStrategyEditorUsernamesState(usernames);
    writeStorage("strategyEditorUsernames", usernames);
  };

  const setPendingAccountRequests = (requests: PendingAccountRequest[]) => {
    setPendingAccountRequestsState(requests);
    writeStorage("pendingAccountRequests", requests);
  };

  const setIsAdmin = (nextIsAdmin: boolean) => {
    setIsAdminState(nextIsAdmin);
    writeStorage("isAdmin", nextIsAdmin);
  };

  const persistAuthAccounts = (accounts: LocalAuthAccount[]) => {
    setAuthAccountsState(accounts);
    writeStorage("auth_accounts", accounts);
  };

  const ensureSeedAccounts = async (accounts: LocalAuthAccount[]) => {
    const resetRequested = consumeLocalAccountResetRequest();
    if (!shouldSeedMvpAccounts() && !resetRequested) return [];

    let nextAccounts = resetRequested ? [] : pruneLegacySeedAuthAccounts(accounts);

    for (const seedAccount of SEED_AUTH_CREDENTIALS) {
      const result = await ensureLocalAccount(
        nextAccounts,
        seedAccount.username,
        seedAccount.password,
        {
          id: seedAccount.id,
          now: seedAccount.createdAt,
        },
      );

      if (!result.error) {
        nextAccounts = result.accounts;
      }
    }

    return nextAccounts;
  };

  useEffect(() => {
    let ignore = false;

    async function seedMvpAccounts() {
      if (!shouldSeedMvpAccounts()) {
        if (authAccounts.length > 0) {
          persistAuthAccounts([]);
        }
        return;
      }

      const nextAccounts = await ensureSeedAccounts(authAccounts);
      if (ignore || nextAccounts === authAccounts) {
        return;
      }

      setAuthAccountsState((currentAccounts) => {
        const sanitizedCurrentAccounts = pruneLegacySeedAuthAccounts(currentAccounts);
        if (SEED_AUTH_CREDENTIALS.every((seedAccount) =>
          sanitizedCurrentAccounts.some((account) => account.username === seedAccount.username),
        )) {
          if (sanitizedCurrentAccounts.length !== currentAccounts.length) {
            writeStorage("auth_accounts", sanitizedCurrentAccounts);
            return sanitizedCurrentAccounts;
          }
          return currentAccounts;
        }

        const mergedAccounts = [...sanitizedCurrentAccounts, ...nextAccounts].filter(
          (account, index, accounts) =>
            accounts.findIndex((item) => item.id === account.id) === index,
        );
        writeStorage("auth_accounts", mergedAccounts);
        return mergedAccounts;
      });
    }

    void seedMvpAccounts();

    return () => {
      ignore = true;
    };
  }, []);

  const setAuthSession = (user: AuthUser | null) => {
    setAuthUserState(user);
    if (user) {
      writeStorage("auth_session", user);
    } else {
      localStorage.removeItem(storageKey("auth_session"));
    }
  };

  const ensureMemberForUser = (user: AuthUser) => {
    setMembersState((currentMembers) => {
      if (currentMembers.some((member) => member.authUserId === user.id)) {
        return currentMembers;
      }

      if (currentMembers.some((member) => member.username === user.username)) {
        const nextMembers = currentMembers.map((member) =>
          member.username === user.username ? { ...member, authUserId: user.id } : member,
        );
        writeStorage("members", nextMembers);
        return nextMembers;
      }

      const nextMembers = [...currentMembers, createMemberForAuthUser(user)];
      writeStorage("members", nextMembers);
      return nextMembers;
    });
  };

  const signup = async (identifier: string, password: string) => {
    const accountsForSignup = await ensureSeedAccounts(authAccounts);
    if (accountsForSignup !== authAccounts) {
      persistAuthAccounts(accountsForSignup);
    }

    const result = await createPendingAccountRequest(
      pendingAccountRequests,
      accountsForSignup,
      identifier,
      password,
    );
    if (result.error) {
      return { ok: false, error: result.error };
    }

    setPendingAccountRequests(result.requests);
    return { ok: true };
  };

  const approveAccountRequest = (requestId: string) => {
    const result = approvePendingAccountRequest(
      pendingAccountRequests,
      authAccounts,
      requestId,
      isAdmin,
    );

    if (result.error) {
      return { ok: false, error: result.error };
    }

    persistAuthAccounts(result.accounts);
    setPendingAccountRequests(result.requests);
    ensureMemberForUser({
      id: result.account.id,
      username: result.account.username,
      email: result.account.email,
    });
    return { ok: true };
  };

  const rejectAccountRequest = (requestId: string) => {
    const result = rejectPendingAccountRequest(
      pendingAccountRequests,
      requestId,
      isAdmin,
    );

    if (result.error) {
      return { ok: false, error: result.error };
    }

    setPendingAccountRequests(result.requests);
    return { ok: true };
  };

  const login = async (identifier: string, password: string) => {
    const accountsForLogin = await ensureSeedAccounts(authAccounts);
    if (accountsForLogin !== authAccounts) {
      persistAuthAccounts(accountsForLogin);
    }

    const result = await verifyLocalCredentials(accountsForLogin, identifier, password);
    if (result.error) {
      return { ok: false, error: result.error };
    }

    setAuthSession(result.user);
    if (result.user.username === OWNER_USERNAME) {
      setIsAdminState(true);
      writeStorage("isAdmin", true);
    }
    ensureMemberForUser(result.user);
    return { ok: true };
  };

  const connectEmail = async (email: string) => {
    if (!authUser) {
      return { ok: false, error: "No signed-in account found." };
    }

    const result = connectAccountEmail(authAccounts, authUser.id, email);
    if (result.error) {
      return { ok: false, error: result.error };
    }

    persistAuthAccounts(result.accounts);
    setAuthSession(result.user);
    return { ok: true };
  };

  const changePassword = async (password: string) => {
    if (!authUser) {
      return { ok: false, error: "No signed-in account found." };
    }

    const result = await changeAccountPassword(authAccounts, authUser.id, password);
    if (result.error) {
      return { ok: false, error: result.error };
    }

    persistAuthAccounts(result.accounts);
    setAuthSession(result.user);
    return { ok: true };
  };

  const notifyTeamOnline = () => {
    const notification = createOnlineNotification(authUser?.username ?? "kingchoou");
    setNotifications([notification, ...notifications].slice(0, 10));
    return notification;
  };

  const assignMemberTeam = (memberId: string, teamName: string) => {
    const result = assignMemberTeamData(members, memberId, teamName, isAdmin, teams);
    if (result.ok) {
      setMembers(result.members);
    }

    return { ok: result.ok, error: result.error };
  };

  const createTeam = (name: string) => {
    const result = createTeamData(teams, name, isAdmin);
    if (result.ok) {
      setTeams(result.teams);
    }

    return { ok: result.ok, error: result.error };
  };

  const archiveTeam = (teamId: string) => {
    const result = archiveTeamData(teams, members, teamId, isAdmin);
    if (result.ok) {
      setTeams(result.teams);
      setMembers(result.members);
    }

    return { ok: result.ok, error: result.error };
  };

  const archiveMember = (memberId: string, reason?: string) => {
    const result = archiveMemberData(members, memberId, isAdmin, reason);
    if (result.ok) {
      setMembers(result.members);
    }

    return { ok: result.ok, error: result.error };
  };

  const getActiveSeasonId = () =>
    seasons.find((season) => season.isActive)?.id ?? ACTIVE_SEASON.id;

  const updateMythicRanks = (
    updates: { memberId: string; rankStatus: RankStatus | string; stars: number }[],
  ) => {
    const result = applyMythicRankUpdates({
      isAdmin,
      members,
      rankHistory,
      transactions: rpTransactions,
      seasonId: getActiveSeasonId(),
      updates,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const updateMap = new Map(
      updates.map((update) => [
        update.memberId,
        getValidRankStatus(update.rankStatus),
      ]),
    );
    const updatedMembers = members.map((member) => {
      const rankStatus = updateMap.get(member.id);
      return rankStatus ? { ...member, currentRank: rankStatus } : member;
    });

    setMembers(updatedMembers);
    setRankHistory(result.rankHistory);
    setRpTransactions(result.transactions);

    return { ok: true };
  };

  const addRpTransaction = (input: {
    memberId: string;
    sourceType: RpSourceType;
    amount: number;
    description: string;
    occurredAt?: string;
  }) => {
    if (!isAdmin) {
      return {
        ok: false,
        error: "Only Admin Portal users can add RP transactions.",
      };
    }

    if (!members.some((member) => member.id === input.memberId)) {
      return { ok: false, error: "Member not found." };
    }

    if (!Number.isFinite(input.amount) || input.amount === 0) {
      return { ok: false, error: "Enter a non-zero RP amount." };
    }

    const now = new Date();
    const timestamp = input.occurredAt || now.toISOString();
    const nextTransaction: RpTransaction = {
      id: `rp_manual_${input.memberId}_${now.getTime()}`,
      seasonId: getActiveSeasonId(),
      memberId: input.memberId,
      sourceType: input.sourceType,
      amount: Math.trunc(input.amount),
      description: input.description.trim() || "Admin Portal RP adjustment",
      occurredAt: timestamp,
      createdAt: now.toISOString(),
    };

    setRpTransactions([nextTransaction, ...rpTransactions]);
    return { ok: true };
  };

  const resetSeason = () => {
    const result = resetSeasonForMembers({
      isAdmin,
      seasons,
      members,
      rankHistory,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setSeasonsState(result.seasons);
    setMembers(result.members);
    setRankHistory(result.rankHistory);
    writeStorage("seasons", result.seasons);

    return { ok: true };
  };

  const logout = () => {
    setAuthSession(null);
    setIsAdmin(false);
  };

  const resetData = () => {
    [...activeDataKeys, ...RETIRED_STORAGE_KEYS].forEach((key) => {
      localStorage.removeItem(storageKey(key));
    });
    writeStorage("schema_version", MVP_STORAGE_VERSION);
    const nextMembers = getInitialMembers(authUser);
    setMembersState(nextMembers);
    setAnnouncementsState(defaultState.announcements);
    setNotificationsState(defaultState.notifications);
    setSquadLogoSrcState(defaultState.squadLogoSrc);
    setSeasonsState(defaultState.seasons);
    setTeamsState(defaultState.teams);
    setRpTransactionsState(defaultState.rpTransactions);
    setRankHistoryState(defaultState.rankHistory);
    setPublicStrategyPlacementsState(defaultState.publicStrategyPlacements);
    setPrivateStrategyPlacementsByUserState(defaultState.privateStrategyPlacementsByUser);
    setStrategyEditorUsernamesState(defaultState.strategyEditorUsernames);
    setPendingAccountRequestsState(defaultState.pendingAccountRequests);
    setIsAdminState(defaultState.isAdmin);
    writeStorage("members", nextMembers);
    writeStorage("announcements", defaultState.announcements);
    writeStorage("notifications", defaultState.notifications);
    writeStorage("squadLogoSrc", defaultState.squadLogoSrc);
    writeStorage("seasons", defaultState.seasons);
    writeStorage("teams", defaultState.teams);
    writeStorage("rpTransactions", defaultState.rpTransactions);
    writeStorage("rankHistory", defaultState.rankHistory);
    writeStorage("publicStrategyPlacements", defaultState.publicStrategyPlacements);
    writeStorage("privateStrategyPlacementsByUser", defaultState.privateStrategyPlacementsByUser);
    writeStorage("strategyEditorUsernames", defaultState.strategyEditorUsernames);
    writeStorage("pendingAccountRequests", defaultState.pendingAccountRequests);
  };

  return (
    <AppContext.Provider
      value={{
        members,
        announcements,
        notifications,
        squadLogoSrc,
        seasons,
        teams,
        rpTransactions,
        rankHistory,
        publicStrategyPlacements,
        privateStrategyPlacementsByUser,
        strategyEditorUsernames,
        pendingAccountRequests,
        approvedAccountCount: authAccounts.length,
        isAdmin,
        authUser,
        setMembers,
        setAnnouncements,
        setNotifications,
        setSquadLogoSrc,
        setTeams,
        setRpTransactions,
        setRankHistory,
        setPublicStrategyPlacements,
        setPrivateStrategyPlacements,
        setStrategyEditorUsernames,
        setPendingAccountRequests,
        setIsAdmin,
        login,
        signup,
        approveAccountRequest,
        rejectAccountRequest,
        connectEmail,
        changePassword,
        notifyTeamOnline,
        assignMemberTeam,
        createTeam,
        archiveTeam,
        archiveMember,
        resetSeason,
        updateMythicRanks,
        addRpTransaction,
        logout,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
