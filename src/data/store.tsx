import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Announcement, Member, Notification, Tryout } from "../types";
import { mockAnnouncements, mockMembers, mockTryouts } from "./mock";
import {
  AuthUser,
  changeAccountPassword,
  connectAccountEmail,
  createLocalAccount,
  ensureLocalAccount,
  LocalAuthAccount,
  normalizeIdentifier,
  verifyLocalCredentials,
} from "../lib/localAuth";
import {
  ADMIN_PORTAL_PASSWORD,
  DEFAULT_TEAM,
  MVP_STORAGE_VERSION,
  assignMemberTeam as assignMemberTeamData,
  createOnlineNotification,
} from "../lib/mvpApp";
import {
  RemoteAppState,
  loadRemoteAppState,
  saveRemoteAppState,
} from "../lib/supabaseAppState";
import { isSupabaseConfigured } from "../lib/supabaseClient";

interface AppState {
  members: Member[];
  announcements: Announcement[];
  tryouts: Tryout[];
  notifications: Notification[];
  squadLogoSrc: string;
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
  setMembers: (members: Member[]) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  setTryouts: (tryouts: Tryout[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setSquadLogoSrc: (src: string) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  login: (identifier: string, password: string) => Promise<AuthActionResult>;
  signup: (identifier: string, password: string) => Promise<AuthActionResult>;
  connectEmail: (email: string) => Promise<AuthActionResult>;
  changePassword: (password: string) => Promise<AuthActionResult>;
  notifyTeamOnline: () => Notification;
  assignMemberTeam: (memberId: string, teamName: string) => AssignTeamResult;
  logout: () => void;
  resetData: () => void;
}

const defaultState: AppState = {
  members: mockMembers,
  announcements: mockAnnouncements,
  tryouts: mockTryouts,
  notifications: [],
  squadLogoSrc: "",
  isAdmin: false,
  authUser: null,
};

const MVP_OWNER_USERNAME = "kingchoou";
const MVP_OWNER_ACCOUNT_ID = "auth_kingchoou";
const MVP_OWNER_CREATED_AT = new Date("2026-05-16T00:00:00.000Z");

const AppContext = createContext<AppContextType | undefined>(undefined);

const activeDataKeys = [
  "members",
  "announcements",
  "tryouts",
  "notifications",
  "squadLogoSrc",
  "isAdmin",
];

const retiredDataKeys = ["teams", "schedule", "matches", "points"];

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

function writeAppStateSnapshot(state: RemoteAppState) {
  writeStorage("members", state.members);
  writeStorage("announcements", state.announcements);
  writeStorage("tryouts", state.tryouts);
  writeStorage("notifications", state.notifications);
  writeStorage("squadLogoSrc", state.squadLogoSrc);
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

function getInitialMembers(authUser: AuthUser | null): Member[] {
  if (!authUser) {
    return defaultState.members;
  }

  return [createMemberForAuthUser(authUser)];
}

function runMvpMigration() {
  try {
    if (localStorage.getItem(storageKey("schema_version")) === MVP_STORAGE_VERSION) {
      return;
    }

    const authUser = readStorage<AuthUser | null>("auth_session", null);
    retiredDataKeys.forEach((key) => localStorage.removeItem(storageKey(key)));
    localStorage.removeItem(storageKey("isAdmin"));
    writeStorage("members", getInitialMembers(authUser));
    writeStorage("notifications", []);
    writeStorage("schema_version", MVP_STORAGE_VERSION);
  } catch {
    // Local storage can be unavailable in private contexts; the in-memory defaults still work.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  runMvpMigration();
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const [authAccounts, setAuthAccountsState] = useState<LocalAuthAccount[]>(
    readStorage("auth_accounts", []),
  );
  const [authUser, setAuthUserState] = useState<AuthUser | null>(
    readStorage("auth_session", defaultState.authUser),
  );
  const [members, setMembersState] = useState<Member[]>(
    readStorage("members", getInitialMembers(authUser)),
  );
  const [announcements, setAnnouncementsState] = useState<Announcement[]>(
    readStorage("announcements", defaultState.announcements),
  );
  const [tryouts, setTryoutsState] = useState<Tryout[]>(
    readStorage("tryouts", defaultState.tryouts),
  );
  const [notifications, setNotificationsState] = useState<Notification[]>(
    readStorage("notifications", defaultState.notifications),
  );
  const [squadLogoSrc, setSquadLogoSrcState] = useState<string>(
    readStorage("squadLogoSrc", defaultState.squadLogoSrc),
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
        setMembersState(remoteState.members);
        setAnnouncementsState(remoteState.announcements);
        setTryoutsState(remoteState.tryouts);
        setNotificationsState(remoteState.notifications);
        setSquadLogoSrcState(remoteState.squadLogoSrc);
        writeAppStateSnapshot(remoteState);
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
        tryouts,
        notifications,
        squadLogoSrc,
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
    squadLogoSrc,
    tryouts,
  ]);

  const setMembers = (nextMembers: Member[]) => {
    setMembersState(nextMembers);
    writeStorage("members", nextMembers);
  };

  const setAnnouncements = (nextAnnouncements: Announcement[]) => {
    setAnnouncementsState(nextAnnouncements);
    writeStorage("announcements", nextAnnouncements);
  };

  const setTryouts = (nextTryouts: Tryout[]) => {
    setTryoutsState(nextTryouts);
    writeStorage("tryouts", nextTryouts);
  };

  const setNotifications = (nextNotifications: Notification[]) => {
    setNotificationsState(nextNotifications);
    writeStorage("notifications", nextNotifications);
  };

  const setSquadLogoSrc = (src: string) => {
    setSquadLogoSrcState(src);
    writeStorage("squadLogoSrc", src);
  };

  const setIsAdmin = (nextIsAdmin: boolean) => {
    setIsAdminState(nextIsAdmin);
    writeStorage("isAdmin", nextIsAdmin);
  };

  const persistAuthAccounts = (accounts: LocalAuthAccount[]) => {
    setAuthAccountsState(accounts);
    writeStorage("auth_accounts", accounts);
  };

  const ensureMvpOwnerAccount = async (accounts: LocalAuthAccount[]) => {
    const result = await ensureLocalAccount(
      accounts,
      MVP_OWNER_USERNAME,
      ADMIN_PORTAL_PASSWORD,
      {
        id: MVP_OWNER_ACCOUNT_ID,
        now: MVP_OWNER_CREATED_AT,
      },
    );

    if (result.error) {
      return accounts;
    }

    return result.accounts;
  };

  useEffect(() => {
    let ignore = false;

    async function seedMvpOwnerAccount() {
      const nextAccounts = await ensureMvpOwnerAccount(authAccounts);
      if (ignore || nextAccounts === authAccounts) {
        return;
      }

      setAuthAccountsState((currentAccounts) => {
        if (
          currentAccounts.some(
            (account) => account.username === MVP_OWNER_USERNAME,
          )
        ) {
          return currentAccounts;
        }

        const mergedAccounts = [...currentAccounts, ...nextAccounts].filter(
          (account, index, accounts) =>
            accounts.findIndex((item) => item.id === account.id) === index,
        );
        writeStorage("auth_accounts", mergedAccounts);
        return mergedAccounts;
      });
    }

    void seedMvpOwnerAccount();

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
      if (
        currentMembers.some(
          (member) => member.authUserId === user.id || member.username === user.username,
        )
      ) {
        return currentMembers;
      }

      const nextMembers = [...currentMembers, createMemberForAuthUser(user)];
      writeStorage("members", nextMembers);
      return nextMembers;
    });
  };

  const signup = async (identifier: string, password: string) => {
    const result = await createLocalAccount(authAccounts, identifier, password);
    if (result.error) {
      return { ok: false, error: result.error };
    }

    persistAuthAccounts(result.accounts);
    setAuthSession(result.user);
    ensureMemberForUser(result.user);
    return { ok: true };
  };

  const login = async (identifier: string, password: string) => {
    let accountsForLogin = authAccounts;
    if (normalizeIdentifier(identifier) === MVP_OWNER_USERNAME) {
      accountsForLogin = await ensureMvpOwnerAccount(authAccounts);
      if (accountsForLogin !== authAccounts) {
        persistAuthAccounts(accountsForLogin);
      }
    }

    const result = await verifyLocalCredentials(accountsForLogin, identifier, password);
    if (result.error) {
      return { ok: false, error: result.error };
    }

    setAuthSession(result.user);
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
    const result = assignMemberTeamData(members, memberId, teamName, isAdmin);
    if (result.ok) {
      setMembers(result.members);
    }

    return { ok: result.ok, error: result.error };
  };

  const logout = () => {
    setAuthSession(null);
    setIsAdmin(false);
  };

  const resetData = () => {
    [...activeDataKeys, ...retiredDataKeys].forEach((key) => {
      localStorage.removeItem(storageKey(key));
    });
    writeStorage("schema_version", MVP_STORAGE_VERSION);
    const nextMembers = getInitialMembers(authUser);
    setMembersState(nextMembers);
    setAnnouncementsState(defaultState.announcements);
    setTryoutsState(defaultState.tryouts);
    setNotificationsState(defaultState.notifications);
    setSquadLogoSrcState(defaultState.squadLogoSrc);
    setIsAdminState(defaultState.isAdmin);
    writeStorage("members", nextMembers);
    writeStorage("announcements", defaultState.announcements);
    writeStorage("tryouts", defaultState.tryouts);
    writeStorage("notifications", defaultState.notifications);
    writeStorage("squadLogoSrc", defaultState.squadLogoSrc);
  };

  return (
    <AppContext.Provider
      value={{
        members,
        announcements,
        tryouts,
        notifications,
        squadLogoSrc,
        isAdmin,
        authUser,
        setMembers,
        setAnnouncements,
        setTryouts,
        setNotifications,
        setSquadLogoSrc,
        setIsAdmin,
        login,
        signup,
        connectEmail,
        changePassword,
        notifyTeamOnline,
        assignMemberTeam,
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
