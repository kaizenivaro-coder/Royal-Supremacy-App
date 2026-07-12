import type { Announcement, Member } from "../types";
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
    message: "Teams, profiles, announcements, and admin assignment are the current priority.",
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
