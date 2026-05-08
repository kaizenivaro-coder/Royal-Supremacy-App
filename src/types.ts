export interface Member {
  id: string;
  playerName: string;
  mlbbId: string;
  serverId: string;
  mainRole: string;
  secondaryRole: string;
  mainHeroes: string[];
  currentRank: string;
  highestRank: string;
  team: string; // Team Sovereign, Royal Valor, Academy, Unassigned
  status: string; // Active, Inactive, Trial, Suspended, Left
  royalPoints: number;
  attendanceRate: number;
}

export interface Team {
  id: string;
  name: string;
  type: string;
  captain: string;
  members: string[]; // member ids
  notes: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  type: string; // Practice, Ranked Push, Scrim, Tournament, Team Meeting, VOD Review
  date: string;
  time: string;
  team: string;
  description: string;
  attendance: Record<string, string>; // memberId -> 'Attending' | 'Maybe' | 'Not Attending'
}

export interface Match {
  id: string;
  date: string;
  matchType: string;
  team: string;
  enemyTeam: string;
  result: string; // Win, Loss, Draw / Cancelled
  mvp: string; // memberId or playerName
  bestPerformer: string;
  mainMistake: string;
  notes: string;
}

export interface PointTransaction {
  id: string;
  memberId: string;
  change: number; // e.g., 10 or -10
  reason: string;
  addedBy: string;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string; // Normal, Important, Urgent
  postedBy: string;
  date: string;
}

export interface Tryout {
  id: string;
  playerName: string;
  mlbbId: string;
  serverId: string;
  currentRank: string;
  highestRank: string;
  mainRole: string;
  secondaryRole: string;
  mainHeroes: string[];
  country: string;
  availability: string;
  whatsapp: string;
  reason: string; // Why they want to join
  status: string; // Pending, Accepted, Rejected, Trial, Needs Test Match
}
