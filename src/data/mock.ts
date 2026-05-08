import {
  Member,
  Team,
  ScheduleEvent,
  Match,
  PointTransaction,
  Announcement,
  Tryout,
} from "../types";

export const mockMembers: Member[] = [
  {
    id: "member_001",
    playerName: "King Choou",
    mlbbId: "123456789",
    serverId: "1234",
    mainRole: "EXP",
    secondaryRole: "Roam",
    mainHeroes: ["Chou", "Gatotkaca", "Yu Zhong"],
    currentRank: "Mythical Honor",
    highestRank: "Mythical Glory",
    team: "Team Sovereign",
    status: "Active",
    royalPoints: 240,
    attendanceRate: 92,
  },
  {
    id: "member_002",
    playerName: "Gato",
    mlbbId: "987654321",
    serverId: "4321",
    mainRole: "Mid",
    secondaryRole: "Gold",
    mainHeroes: ["Pharsa", "Lylia", "Cecilion"],
    currentRank: "Mythical Glory",
    highestRank: "Mythical Glory",
    team: "Team Sovereign",
    status: "Active",
    royalPoints: 190,
    attendanceRate: 85,
  },
  {
    id: "member_003",
    playerName: "Shadow",
    mlbbId: "11223344",
    serverId: "2233",
    mainRole: "Jungle",
    secondaryRole: "EXP",
    mainHeroes: ["Ling", "Fanny", "Hayabusa"],
    currentRank: "Mythic",
    highestRank: "Mythical Honor",
    team: "Royal Valor",
    status: "Active",
    royalPoints: 120,
    attendanceRate: 70,
  },
];

export const mockTeams: Team[] = [
  {
    id: "team_001",
    name: "Team Sovereign",
    type: "Competitive Team",
    captain: "King Choou",
    members: ["member_001", "member_002"],
    notes: "Main competitive team for serious ranked and tournaments.",
  },
  {
    id: "team_002",
    name: "Royal Valor",
    type: "Second Team / Developing",
    captain: "Shadow",
    members: ["member_003"],
    notes: "Secondary team focusing on synergy.",
  },
  {
    id: "team_003",
    name: "Academy",
    type: "Trial Players",
    captain: "Admin",
    members: [],
    notes: "New recruits.",
  },
  {
    id: "team_004",
    name: "Unassigned",
    type: "General",
    captain: "Admin",
    members: [],
    notes: "Players without a set team.",
  },
];

export const mockSchedule: ScheduleEvent[] = [
  {
    id: "event_001",
    title: "Friday Ranked Push",
    type: "Ranked Push",
    date: "2026-05-08",
    time: "20:00",
    team: "Team Sovereign",
    description: "Main ranked push session for Team Sovereign.",
    attendance: {
      member_001: "Attending",
      member_002: "Maybe",
      member_003: "Not Attending",
    },
  },
];

export const mockMatches: Match[] = [
  {
    id: "match_001",
    date: "2026-05-08",
    matchType: "Scrim",
    team: "Team Sovereign",
    enemyTeam: "Shadow Fang",
    result: "Win",
    mvp: "King Choou",
    bestPerformer: "Gato",
    mainMistake: "Weak early rotation",
    notes: "Roamer should rotate faster to turtle side.",
  },
];

export const mockPoints: PointTransaction[] = [
  {
    id: "points_001",
    memberId: "member_001",
    change: 10,
    reason: "Attended practice",
    addedBy: "Admin",
    date: "2026-05-08",
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: "announcement_001",
    title: "Welcome to Royal Supremacy",
    message: "The new command center is live. Let's conquer the Land of Dawn.",
    priority: "Important",
    postedBy: "King Choou",
    date: "2026-05-07",
  },
];

export const mockTryouts: Tryout[] = [
  {
    id: "tryout_001",
    playerName: "New Player",
    mlbbId: "987654321",
    serverId: "4321",
    currentRank: "Mythic",
    highestRank: "Mythical Glory",
    mainRole: "Jungle",
    secondaryRole: "Gold",
    mainHeroes: ["Ling", "Lancelot", "Hayabusa"],
    country: "Tanzania",
    availability: "Evenings and weekends",
    whatsapp: "+255...",
    reason: "I want to join a serious MLBB squad.",
    status: "Pending",
  },
];
