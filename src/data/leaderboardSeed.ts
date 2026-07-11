import type {
  Member,
  RankHistory,
  RankStatus,
  RpTransaction,
  Season,
} from "../types";

export const ACTIVE_SEASON: Season = {
  id: "mlbb_season_40",
  name: "MLBB Season 40",
  mlbbSeasonNumber: 40,
  startDate: "2026-05-28",
  isActive: true,
};

export type LeaderboardMemberSeed = {
  id: string;
  displayName: string;
  username: string;
  rp: number;
  rankStatus: RankStatus;
  stars: number;
};

function inferRankStatusFromStars(stars: number): RankStatus {
  if (stars >= 100) return "Mythical Immortal";
  if (stars >= 50) return "Mythical Glory";
  if (stars >= 25) return "Mythical Honor";
  if (stars > 0) return "Mythic";
  return "Unranked";
}

const mythicMember = (
  id: string,
  displayName: string,
  username: string,
  rp: number,
  stars: number,
): LeaderboardMemberSeed => ({
  id,
  displayName,
  username,
  rp,
  rankStatus: inferRankStatusFromStars(stars),
  stars,
});

export const LEADERBOARD_MEMBER_SEEDS: LeaderboardMemberSeed[] = [
  mythicMember("member_kingchoou", "King Choou", "kingchoou", 388, 57),
  mythicMember("member_kingvoid", "King Void", "kingvoid", 562, 107),
  mythicMember("member_gaytastrophe", "Gaytastrophe", "gaytastrophe", 521, 90),
  mythicMember("member_kinggato", "King Gato", "kinggato", 474, 75),
  mythicMember("member_horsemanofhope", "Horseman of Hope", "horsemanofhope", 494, 106),
  mythicMember("member_jaypolebirth", "Jaypolebirth", "jaypolebirth", 421, 144),
  mythicMember("member_omen", "Omen", "omen", 277, 49),
  mythicMember("member_tranquilizer", "Tranquilizer", "tranquilizer", 271, 45),
  mythicMember("member_queenmiko", "Queen Miko", "queenmiko", 252, 36),
  {
    id: "member_escobartitus",
    displayName: "Escobar Titus",
    username: "escobartitus",
    rp: 192,
    rankStatus: "Epic",
    stars: 0,
  },
  mythicMember("member_lonelydemon", "Lonely Demon", "lonelydemon", 174, 14),
  mythicMember("member_abby_icon", "Abby Icon", "abby_icon", 131, 26),
  mythicMember("member_monarch", "monarch", "monarch", 90, 30),
  mythicMember("member_dedero", "Dedero", "dedero", 55, 23),
  {
    id: "member_kingabdiiy",
    displayName: "KING ABDIIY",
    username: "kingabdiiy",
    rp: 30,
    rankStatus: "Legend",
    stars: 0,
  },
  mythicMember("member_delta_monarch", "ΔMonarch™", "delta_monarch", -73, 24),
  mythicMember("member_namor", "Namor", "namor", -76, 31),
  mythicMember("member_dantezz", "Dantezz", "dantezz", -100, 25),
  {
    id: "member_fakerjr",
    displayName: "FakerJR",
    username: "fakerjr",
    rp: -200,
    rankStatus: "Legend",
    stars: 0,
  },
  {
    id: "member_thepsychoslasher",
    displayName: "ThePsychoSlasher",
    username: "thepsychoslasher",
    rp: -200,
    rankStatus: "Legend",
    stars: 0,
  },
  {
    id: "member_bluex24",
    displayName: "Bluex24",
    username: "bluex24",
    rp: -200,
    rankStatus: "Mythic Placement",
    stars: 0,
  },
];

export const OWNER_USERNAME = "kingchoou";

const ownerMember = LEADERBOARD_MEMBER_SEEDS.find(
  (member) => member.username === OWNER_USERNAME,
);

if (!ownerMember) {
  throw new Error("Royal Supremacy owner seed is missing.");
}

export const SEED_AUTH_CREDENTIALS = [{
  id: `auth_${ownerMember.username}`,
  displayName: ownerMember.displayName,
  username: ownerMember.username,
  password: "Toxic0303#",
  createdAt: new Date("2026-05-28T00:00:00.000Z"),
}];

export const LEGACY_SEED_AUTH_ACCOUNT_IDS = LEADERBOARD_MEMBER_SEEDS
  .filter((member) => member.username !== OWNER_USERNAME)
  .map((member) => `auth_${member.username}`);

function normalizeDisplayName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function createSeedMembers(): Member[] {
  return LEADERBOARD_MEMBER_SEEDS.map((member) => ({
    id: member.id,
    username: member.username,
    authUserId: member.username === OWNER_USERNAME ? `auth_${member.username}` : undefined,
    playerName: member.displayName,
    normalizedName: normalizeDisplayName(member.displayName),
    mlbbId: "",
    serverId: "",
    mainRole: member.username === "kingchoou" ? "EXP Lane" : "Flex",
    secondaryRole: member.username === "kingchoou" ? "Roam" : "Flex",
    mainHeroes:
      member.username === "kingchoou" ? ["Chou", "Gatotkaca", "Yu Zhong"] : [],
    currentRank: member.rankStatus,
    highestRank: member.rankStatus === "Mythic Placement" ? "Mythic" : member.rankStatus,
    team: "Unassigned",
    status: "Active",
    bannerId: "chou-stun",
    joinedAt: "2026-05-28",
  }));
}

export function createSeedRankHistory(): RankHistory[] {
  const createdAt = "2026-05-28T00:00:00.000Z";

  return LEADERBOARD_MEMBER_SEEDS.map((member) => ({
    id: `rank_seed_${member.username}`,
    seasonId: ACTIVE_SEASON.id,
    memberId: member.id,
    rankStatus: member.rankStatus,
    stars: member.stars,
    recordedAt: createdAt,
    createdAt,
  }));
}

export function createSeedRpTransactions(): RpTransaction[] {
  const createdAt = "2026-05-28T00:00:00.000Z";

  return LEADERBOARD_MEMBER_SEEDS.flatMap((member) => {
    const baseAmount = member.rp - member.stars;
    const transactions: RpTransaction[] = [];

    if (baseAmount !== 0) {
      transactions.push({
        id: `rp_seed_base_${member.username}`,
        seasonId: ACTIVE_SEASON.id,
        memberId: member.id,
        sourceType: "Manual Adjustments",
        amount: baseAmount,
        description: "Current RP seed for MVP leaderboard",
        occurredAt: createdAt,
        createdAt,
      });
    }

    if (member.stars !== 0) {
      transactions.push({
        id: `rp_seed_stars_${member.username}`,
        seasonId: ACTIVE_SEASON.id,
        memberId: member.id,
        sourceType: "Mythic Stars",
        amount: member.stars,
        description: "Current Mythic Stars RP seed",
        occurredAt: createdAt,
        createdAt,
      });
    }

    return transactions;
  });
}
