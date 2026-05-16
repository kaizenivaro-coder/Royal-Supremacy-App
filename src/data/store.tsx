import React, { createContext, useContext, useState } from "react";
import type { Announcement, Member, Notification, Tryout } from "../types";
import { mockAnnouncements, mockMembers, mockTryouts } from "./mock";
import {
  AuthUser,
  changeAccountPassword,
  connectAccountEmail,
  createLocalAccount,
  LocalAuthAccount,
  verifyLocalCredentials,
} from "../lib/localAuth";
import {
  DEFAULT_TEAM,
  MVP_STORAGE_VERSION,
  assignMemberTeam as assignMemberTeamData,
  createOnlineNotification,
} from "../lib/mvpApp";

interface AppState {
  members: Member[];
  announcements: Announcement[];
  tryouts: Tryout[];
  notifications: Notification[];
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
  isAdmin: false,
  authUser: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const activeDataKeys = [
  "members",
  "announcements",
  "tryouts",
  "notifications",
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
  const [isAdmin, setIsAdminState] = useState<boolean>(
    readStorage("isAdmin", defaultState.isAdmin),
  );

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

  const setIsAdmin = (nextIsAdmin: boolean) => {
    setIsAdminState(nextIsAdmin);
    writeStorage("isAdmin", nextIsAdmin);
  };

  const persistAuthAccounts = (accounts: LocalAuthAccount[]) => {
    setAuthAccountsState(accounts);
    writeStorage("auth_accounts", accounts);
  };

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
    const result = await verifyLocalCredentials(authAccounts, identifier, password);
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
    setIsAdminState(defaultState.isAdmin);
    writeStorage("members", nextMembers);
    writeStorage("announcements", defaultState.announcements);
    writeStorage("tryouts", defaultState.tryouts);
    writeStorage("notifications", defaultState.notifications);
  };

  return (
    <AppContext.Provider
      value={{
        members,
        announcements,
        tryouts,
        notifications,
        isAdmin,
        authUser,
        setMembers,
        setAnnouncements,
        setTryouts,
        setNotifications,
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
