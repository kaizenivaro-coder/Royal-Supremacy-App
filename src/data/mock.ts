import type { Announcement, Member, Tryout } from "../types";

export const mockMembers: Member[] = [
  {
    id: "member_001",
    username: "kingchoou",
    playerName: "King Choou",
    mlbbId: "123456789",
    serverId: "1234",
    mainRole: "EXP Lane",
    secondaryRole: "Roam",
    mainHeroes: ["Chou", "Gatotkaca", "Yu Zhong"],
    currentRank: "Mythical Honor",
    highestRank: "Mythical Glory",
    team: "Unassigned",
    status: "Active",
    bannerId: "chou-stun",
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: "announcement_001",
    title: "Welcome to Royal Supremacy",
    message: "The command center has been simplified for the first squad MVP.",
    priority: "Important",
    postedBy: "King Choou",
    date: "2026-05-07",
  },
  {
    id: "announcement_002",
    title: "MVP Build Focus",
    message: "Teams, profiles, announcements, tryouts, and admin assignment are the current priority.",
    priority: "Normal",
    postedBy: "King Choou",
    date: "2026-05-09",
  },
  {
    id: "announcement_003",
    title: "Team Assignment Pending",
    message: "All members start unassigned until an Admin Portal user places them into a squad team.",
    priority: "Normal",
    postedBy: "King Choou",
    date: "2026-05-11",
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
    secondaryRole: "Gold Lane",
    mainHeroes: ["Ling", "Lancelot", "Hayabusa"],
    country: "Tanzania",
    availability: "Evenings and weekends",
    whatsapp: "+255...",
    reason: "I want to join a serious MLBB squad.",
    status: "Pending",
  },
];
