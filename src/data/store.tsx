import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Member,
  Team,
  ScheduleEvent,
  Match,
  PointTransaction,
  Announcement,
  Tryout,
} from "../types";
import {
  mockMembers,
  mockTeams,
  mockSchedule,
  mockMatches,
  mockPoints,
  mockAnnouncements,
  mockTryouts,
} from "./mock";

interface AppState {
  members: Member[];
  teams: Team[];
  schedule: ScheduleEvent[];
  matches: Match[];
  points: PointTransaction[];
  announcements: Announcement[];
  tryouts: Tryout[];
  isAdmin: boolean;
}

interface AppContextType extends AppState {
  setMembers: (m: Member[]) => void;
  setTeams: (t: Team[]) => void;
  setSchedule: (s: ScheduleEvent[]) => void;
  setMatches: (m: Match[]) => void;
  setPoints: (p: PointTransaction[]) => void;
  setAnnouncements: (a: Announcement[]) => void;
  setTryouts: (t: Tryout[]) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  resetData: () => void;
}

const defaultState: AppState = {
  members: mockMembers,
  teams: mockTeams,
  schedule: mockSchedule,
  matches: mockMatches,
  points: mockPoints,
  announcements: mockAnnouncements,
  tryouts: mockTryouts,
  isAdmin: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const loadData = (key: string, _default: any) => {
    try {
      const data = localStorage.getItem(`royal_supremacy_${key}`);
      return data ? JSON.parse(data) : _default;
    } catch {
      return _default;
    }
  };

  const [members, setMembersState] = useState<Member[]>(
    loadData("members", defaultState.members),
  );
  const [teams, setTeamsState] = useState<Team[]>(
    loadData("teams", defaultState.teams),
  );
  const [schedule, setScheduleState] = useState<ScheduleEvent[]>(
    loadData("schedule", defaultState.schedule),
  );
  const [matches, setMatchesState] = useState<Match[]>(
    loadData("matches", defaultState.matches),
  );
  const [points, setPointsState] = useState<PointTransaction[]>(
    loadData("points", defaultState.points),
  );
  const [announcements, setAnnouncementsState] = useState<Announcement[]>(
    loadData("announcements", defaultState.announcements),
  );
  const [tryouts, setTryoutsState] = useState<Tryout[]>(
    loadData("tryouts", defaultState.tryouts),
  );
  const [isAdmin, setIsAdminState] = useState<boolean>(
    loadData("isAdmin", defaultState.isAdmin),
  );

  const setMembers = (m: Member[]) => {
    setMembersState(m);
    localStorage.setItem("royal_supremacy_members", JSON.stringify(m));
  };
  const setTeams = (t: Team[]) => {
    setTeamsState(t);
    localStorage.setItem("royal_supremacy_teams", JSON.stringify(t));
  };
  const setSchedule = (s: ScheduleEvent[]) => {
    setScheduleState(s);
    localStorage.setItem("royal_supremacy_schedule", JSON.stringify(s));
  };
  const setMatches = (m: Match[]) => {
    setMatchesState(m);
    localStorage.setItem("royal_supremacy_matches", JSON.stringify(m));
  };
  const setPoints = (p: PointTransaction[]) => {
    setPointsState(p);
    localStorage.setItem("royal_supremacy_points", JSON.stringify(p));
  };
  const setAnnouncements = (a: Announcement[]) => {
    setAnnouncementsState(a);
    localStorage.setItem("royal_supremacy_announcements", JSON.stringify(a));
  };
  const setTryouts = (t: Tryout[]) => {
    setTryoutsState(t);
    localStorage.setItem("royal_supremacy_tryouts", JSON.stringify(t));
  };
  const setIsAdmin = (a: boolean) => {
    setIsAdminState(a);
    localStorage.setItem("royal_supremacy_isAdmin", JSON.stringify(a));
  };

  const resetData = () => {
    localStorage.clear();
    setMembersState(defaultState.members);
    setTeamsState(defaultState.teams);
    setScheduleState(defaultState.schedule);
    setMatchesState(defaultState.matches);
    setPointsState(defaultState.points);
    setAnnouncementsState(defaultState.announcements);
    setTryoutsState(defaultState.tryouts);
    setIsAdminState(defaultState.isAdmin);
  };

  return (
    <AppContext.Provider
      value={{
        members,
        teams,
        schedule,
        matches,
        points,
        announcements,
        tryouts,
        isAdmin,
        setMembers,
        setTeams,
        setSchedule,
        setMatches,
        setPoints,
        setAnnouncements,
        setTryouts,
        setIsAdmin,
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
