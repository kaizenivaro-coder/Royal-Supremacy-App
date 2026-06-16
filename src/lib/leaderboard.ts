import type {
  Member,
  RankHistory,
  RankStatus,
  RpSourceType,
  RpTransaction,
  Season,
} from "../types";

export const RANK_STATUS_OPTIONS: RankStatus[] = [
  "Unranked",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
  "Mythic Placement",
];

export const RP_SOURCE_OPTIONS: RpSourceType[] = [
  "Royal FunFest",
  "Customs",
  "Supreme Titles",
  "Active Points",
  "Mythic Stars",
  "Manual Adjustments",
  "Starting Average for new members",
];

export type LeaderboardMemberRef = {
  id: string;
  playerName: string;
};

export type LeaderboardEntry = {
  rank: number;
  memberId: string;
  displayName: string;
  score: number;
};

export type MythicLeaderboard = {
  starEntries: LeaderboardEntry[];
  placementEntries: LeaderboardEntry[];
  noStarEntries: LeaderboardEntry[];
};

export type MythicRankUpdate = {
  memberId: string;
  rankStatus: RankStatus | string;
  stars: number;
};

export type ApplyMythicRankUpdatesInput = {
  isAdmin: boolean;
  members: LeaderboardMemberRef[];
  rankHistory: RankHistory[];
  transactions: RpTransaction[];
  seasonId: string;
  updates: MythicRankUpdate[];
  now?: Date;
};

export type ApplyMythicRankUpdatesResult = {
  ok: boolean;
  error?: string;
  rankHistory: RankHistory[];
  transactions: RpTransaction[];
};

export type ResetSeasonInput = {
  isAdmin: boolean;
  seasons: Season[];
  members: Member[];
  rankHistory: RankHistory[];
  now?: Date;
};

export type ResetSeasonResult = {
  ok: boolean;
  error?: string;
  seasons: Season[];
  members: Member[];
  rankHistory: RankHistory[];
};

const mythicStarRanks = new Set<RankStatus>([
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
]);

function normalizeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function getValidRankStatus(rankStatus: string | undefined): RankStatus {
  const matchedRank = RANK_STATUS_OPTIONS.find((rank) => rank === rankStatus);
  return matchedRank ?? "Unranked";
}

export function isMythicStarRank(rankStatus: string | undefined) {
  return mythicStarRanks.has(getValidRankStatus(rankStatus));
}

export function getMythicStarScore(rankStatus: string | undefined, stars: number) {
  return isMythicStarRank(rankStatus) ? normalizeNumber(stars) : 0;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createMemberLookup(members: LeaderboardMemberRef[]) {
  return new Map(members.map((member) => [member.id, member]));
}

function assignCompetitionRanks(entries: Omit<LeaderboardEntry, "rank">[]) {
  let previousScore: number | undefined;
  let previousRank = 0;

  return entries.map((entry, index) => {
    const rank = entry.score === previousScore ? previousRank : index + 1;
    previousScore = entry.score;
    previousRank = rank;
    return { ...entry, rank };
  });
}

export function calculateRpLeaderboard({
  members,
  transactions,
  seasonId,
}: {
  members: LeaderboardMemberRef[];
  transactions: RpTransaction[];
  seasonId: string;
}) {
  const memberLookup = createMemberLookup(members);
  const memberOrder = new Map(members.map((member, index) => [member.id, index]));
  const totals = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.seasonId === seasonId)
    .forEach((transaction) => {
      totals.set(
        transaction.memberId,
        (totals.get(transaction.memberId) ?? 0) + transaction.amount,
      );
    });

  const entries = members
    .map((member) => ({
      memberId: member.id,
      displayName: memberLookup.get(member.id)?.playerName ?? member.id,
      score: totals.get(member.id) ?? 0,
    }))
    .sort((first, second) => {
      const scoreDelta = second.score - first.score;
      return (
        scoreDelta ||
        (memberOrder.get(first.memberId) ?? 0) -
          (memberOrder.get(second.memberId) ?? 0)
      );
    });

  return assignCompetitionRanks(entries);
}

export function getLatestRankHistoryByMember(
  rankHistory: RankHistory[],
  seasonId: string,
) {
  const latest = new Map<string, RankHistory>();

  rankHistory
    .filter((entry) => entry.seasonId === seasonId)
    .forEach((entry) => {
      const previous = latest.get(entry.memberId);
      if (
        !previous ||
        new Date(entry.recordedAt).getTime() >= new Date(previous.recordedAt).getTime()
      ) {
        latest.set(entry.memberId, entry);
      }
    });

  return latest;
}

export function calculateMythicLeaderboard({
  members,
  rankHistory,
  seasonId,
}: {
  members: LeaderboardMemberRef[];
  rankHistory: RankHistory[];
  seasonId: string;
}): MythicLeaderboard {
  const latestRank = getLatestRankHistoryByMember(rankHistory, seasonId);
  const memberOrder = new Map(members.map((member, index) => [member.id, index]));
  const starEntries: Omit<LeaderboardEntry, "rank">[] = [];
  const placementEntries: LeaderboardEntry[] = [];
  const noStarEntries: LeaderboardEntry[] = [];

  members.forEach((member) => {
    const rank = latestRank.get(member.id);
    if (!rank) {
      noStarEntries.push({
        rank: 0,
        memberId: member.id,
        displayName: member.playerName,
        score: 0,
      });
      return;
    }

    const score = getMythicStarScore(rank.rankStatus, rank.stars);
    if (isMythicStarRank(rank.rankStatus)) {
      starEntries.push({
        memberId: member.id,
        displayName: member.playerName,
        score,
      });
      return;
    }

    if (rank.rankStatus === "Mythic Placement") {
      placementEntries.push({
        rank: 0,
        memberId: member.id,
        displayName: member.playerName,
        score: 0,
      });
      return;
    }

    noStarEntries.push({
      rank: 0,
      memberId: member.id,
      displayName: member.playerName,
      score: 0,
    });
  });

  return {
    starEntries: assignCompetitionRanks(
      starEntries.sort((first, second) => {
        const scoreDelta = second.score - first.score;
        return (
          scoreDelta ||
          (memberOrder.get(first.memberId) ?? 0) -
            (memberOrder.get(second.memberId) ?? 0)
        );
      }),
    ),
    placementEntries,
    noStarEntries,
  };
}

export function getStartingAverageRp({
  members,
  transactions,
  seasonId,
}: {
  members: LeaderboardMemberRef[];
  transactions: RpTransaction[];
  seasonId: string;
}) {
  const leaderboard = calculateRpLeaderboard({ members, transactions, seasonId });
  const positiveScores = leaderboard
    .map((entry) => entry.score)
    .filter((score) => score >= 0);

  if (!positiveScores.length) return 0;

  return Math.floor(
    positiveScores.reduce((total, score) => total + score, 0) /
      positiveScores.length,
  );
}

export function filterRankHistoryForChart({
  rankHistory,
  memberId,
  seasonId,
  days,
  now = new Date(),
}: {
  rankHistory: RankHistory[];
  memberId: string;
  seasonId: string;
  days: number;
  now?: Date;
}) {
  const safeDays = Math.max(1, Math.floor(days));
  const earliestTime = now.getTime() - safeDays * 24 * 60 * 60 * 1000;

  return rankHistory
    .filter((entry) => {
      if (entry.memberId !== memberId || entry.seasonId !== seasonId) {
        return false;
      }

      return new Date(entry.recordedAt).getTime() >= earliestTime;
    })
    .sort(
      (first, second) =>
        new Date(first.recordedAt).getTime() - new Date(second.recordedAt).getTime(),
    );
}

function getNextSeasonNumber(activeSeason: Season | undefined, seasons: Season[]) {
  if (Number.isFinite(activeSeason?.mlbbSeasonNumber)) {
    return activeSeason.mlbbSeasonNumber + 1;
  }

  const seasonNumbers = seasons
    .map((season) => season.mlbbSeasonNumber)
    .filter((seasonNumber) => Number.isFinite(seasonNumber));
  const maxSeasonNumber = Math.max(40, ...seasonNumbers);
  return maxSeasonNumber + 1;
}

export function resetSeasonForMembers({
  isAdmin,
  seasons,
  members,
  rankHistory,
  now = new Date(),
}: ResetSeasonInput): ResetSeasonResult {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can reset seasons.",
      seasons,
      members,
      rankHistory,
    };
  }

  const activeSeason = seasons.find((season) => season.isActive);
  if (!activeSeason) {
    return {
      ok: false,
      error: "No active season found.",
      seasons,
      members,
      rankHistory,
    };
  }

  const nextSeasonNumber = getNextSeasonNumber(activeSeason, seasons);
  const nextSeasonId = `mlbb_season_${nextSeasonNumber}`;
  const timestamp = now.toISOString();
  const activeMembers = members.filter(
    (member) => member.lifecycleStatus !== "Archived",
  );

  return {
    ok: true,
    seasons: [
      ...seasons.map((season) =>
        season.id === activeSeason.id
          ? {
              ...season,
              name: season.name || "MLBB Season 40",
              mlbbSeasonNumber: Number.isFinite(season.mlbbSeasonNumber)
                ? season.mlbbSeasonNumber
                : 40,
              isActive: false,
              endDate: toDateOnly(now),
            }
          : season,
      ),
      {
        id: nextSeasonId,
        name: `MLBB Season ${nextSeasonNumber}`,
        mlbbSeasonNumber: nextSeasonNumber,
        startDate: toDateOnly(now),
        isActive: true,
      },
    ],
    members: members.map((member) =>
      member.lifecycleStatus === "Archived"
        ? member
        : { ...member, currentRank: "Epic" },
    ),
    rankHistory: [
      ...rankHistory,
      ...activeMembers.map((member, index) => ({
        id: `rank_reset_${nextSeasonId}_${member.id}_${now.getTime()}_${index}`,
        seasonId: nextSeasonId,
        memberId: member.id,
        rankStatus: "Epic" as const,
        stars: 0,
        recordedAt: timestamp,
        createdAt: timestamp,
      })),
    ],
  };
}

function createHistoryId(memberId: string, now: Date, index: number) {
  return `rank_${memberId}_${now.getTime()}_${index}`;
}

function createTransactionId(memberId: string, now: Date, index: number) {
  return `rp_mythic_${memberId}_${now.getTime()}_${index}`;
}

export function applyMythicRankUpdates({
  isAdmin,
  members,
  rankHistory,
  transactions,
  seasonId,
  updates,
  now = new Date(),
}: ApplyMythicRankUpdatesInput): ApplyMythicRankUpdatesResult {
  if (!isAdmin) {
    return {
      ok: false,
      error: "Only Admin Portal users can update leaderboard ranks.",
      rankHistory,
      transactions,
    };
  }

  const memberIds = new Set(members.map((member) => member.id));
  const latestRank = getLatestRankHistoryByMember(rankHistory, seasonId);
  const timestamp = now.toISOString();
  const nextRankHistory = [...rankHistory];
  const nextTransactions = [...transactions];

  updates.forEach((update, index) => {
    if (!memberIds.has(update.memberId)) return;

    const rankStatus = getValidRankStatus(update.rankStatus);
    const stars = getMythicStarScore(rankStatus, update.stars);
    const previous = latestRank.get(update.memberId);
    const previousStars = getMythicStarScore(previous?.rankStatus, previous?.stars ?? 0);
    const starDelta = stars - previousStars;

    nextRankHistory.push({
      id: createHistoryId(update.memberId, now, index),
      seasonId,
      memberId: update.memberId,
      rankStatus,
      stars,
      recordedAt: timestamp,
      createdAt: timestamp,
    });

    if (starDelta !== 0) {
      nextTransactions.push({
        id: createTransactionId(update.memberId, now, index),
        seasonId,
        memberId: update.memberId,
        sourceType: "Mythic Stars",
        amount: starDelta,
        description: "Mythic star update from Admin Portal",
        occurredAt: timestamp,
        createdAt: timestamp,
      });
    }
  });

  return {
    ok: true,
    rankHistory: nextRankHistory,
    transactions: nextTransactions,
  };
}
