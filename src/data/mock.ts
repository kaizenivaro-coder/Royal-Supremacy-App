import type { Announcement, Member, Tryout } from "../types";
import { createSeedMembers } from "./leaderboardSeed";
import { publicAsset } from "../lib/publicAssets";

export const mockMembers: Member[] = createSeedMembers();

export const mockAnnouncements: Announcement[] = [
  {
    id: "announcement_001",
    title: "Welcome to Royal Supremacy",
    message: "The command center has been simplified for the first squad MVP.",
    priority: "Important",
    postedBy: "Royal Supremacy",
    date: "2026-05-07",
    imageSrc: publicAsset("banners/chou-stun.jpg"),
    imageName: "Chou STUN command banner",
    likedBy: ["kingchoou"],
    savedBy: [],
    comments: [
      {
        id: "comment_announcement_001_001",
        author: "kingchoou",
        message: "Welcome to the first Royal Supremacy command feed.",
        createdAt: "2026-05-07T20:00:00.000Z",
      },
    ],
  },
  {
    id: "announcement_002",
    title: "MVP Build Focus",
    message: "Teams, profiles, announcements, tryouts, and admin assignment are the current priority.",
    priority: "Normal",
    postedBy: "Royal Supremacy",
    date: "2026-05-09",
    imageSrc: publicAsset("banners/tigreal-lightborn.webp"),
    imageName: "Tigreal Lightborn squad banner",
    likedBy: [],
    savedBy: [],
    comments: [],
  },
  {
    id: "announcement_003",
    title: "Team Assignment Pending",
    message: "All members start unassigned until an Admin Portal user places them into a squad team.",
    priority: "Normal",
    postedBy: "Royal Supremacy",
    date: "2026-05-11",
    imageSrc: publicAsset("banners/tigreal-golden-baron.webp"),
    imageName: "Tigreal Golden Baron squad banner",
    likedBy: [],
    savedBy: [],
    comments: [],
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
