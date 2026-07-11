import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_SEASON,
  LEADERBOARD_MEMBER_SEEDS,
  SEED_AUTH_CREDENTIALS,
  createSeedMembers,
  createSeedRankHistory,
  createSeedRpTransactions,
} from "../data/leaderboardSeed.ts";
import {
  applyMythicRankUpdates,
  calculateMythicLeaderboard,
  calculateRpLeaderboard,
  filterRankHistoryForChart,
  getStartingAverageRp,
  getValidRankStatus,
  isMythicStarRank,
  resetSeasonForMembers,
} from "./leaderboard.ts";

test("seed RP transactions derive the current RP leaderboard totals", () => {
  const members = LEADERBOARD_MEMBER_SEEDS.map((member) => ({
    id: member.id,
    playerName: member.displayName,
  }));
  const leaderboard = calculateRpLeaderboard({
    members,
    transactions: createSeedRpTransactions(),
    seasonId: ACTIVE_SEASON.id,
  });

  assert.deepEqual(
    leaderboard.slice(0, 6).map((entry) => [
      entry.rank,
      entry.displayName,
      entry.score,
    ]),
    [
      [1, "King Void", 562],
      [2, "Gaytastrophe", 521],
      [3, "Horseman of Hope", 494],
      [4, "King Gato", 474],
      [5, "Jaypolebirth", 421],
      [6, "King Choou", 388],
    ],
  );
  assert.deepEqual(
    leaderboard.slice(-3).map((entry) => [entry.rank, entry.displayName, entry.score]),
    [
      [19, "FakerJR", -200],
      [19, "ThePsychoSlasher", -200],
      [19, "Bluex24", -200],
    ],
  );
});

test("mythic leaderboard ranks mythic members and separates placement and no-star ranks", () => {
  const members = LEADERBOARD_MEMBER_SEEDS.map((member) => ({
    id: member.id,
    playerName: member.displayName,
  }));
  const leaderboard = calculateMythicLeaderboard({
    members,
    rankHistory: createSeedRankHistory(),
    seasonId: ACTIVE_SEASON.id,
  });

  assert.deepEqual(
    leaderboard.starEntries.slice(0, 3).map((entry) => [
      entry.rank,
      entry.displayName,
      entry.score,
    ]),
    [
      [1, "Jaypolebirth", 144],
      [2, "King Void", 107],
      [3, "Horseman of Hope", 106],
    ],
  );
  assert.deepEqual(
    leaderboard.placementEntries.map((entry) => entry.displayName),
    ["Bluex24"],
  );
  assert.deepEqual(
    leaderboard.noStarEntries.map((entry) => entry.displayName),
    ["Escobar Titus", "KING ABDIIY", "FakerJR", "ThePsychoSlasher"],
  );
});

test("mythic rank updates require admin and append history plus RP star deltas", () => {
  const members = LEADERBOARD_MEMBER_SEEDS.map((member) => ({
    id: member.id,
    playerName: member.displayName,
  }));
  const rankHistory = createSeedRankHistory();
  const transactions = createSeedRpTransactions();
  const kingChoou = LEADERBOARD_MEMBER_SEEDS.find(
    (member) => member.displayName === "King Choou",
  );
  assert.ok(kingChoou);

  const blocked = applyMythicRankUpdates({
    isAdmin: false,
    members,
    rankHistory,
    transactions,
    seasonId: ACTIVE_SEASON.id,
    updates: [{ memberId: kingChoou.id, rankStatus: "Mythical Glory", stars: 60 }],
    now: new Date("2026-05-28T12:00:00.000Z"),
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.rankHistory.length, rankHistory.length);
  assert.equal(blocked.transactions.length, transactions.length);

  const allowed = applyMythicRankUpdates({
    isAdmin: true,
    members,
    rankHistory,
    transactions,
    seasonId: ACTIVE_SEASON.id,
    updates: [{ memberId: kingChoou.id, rankStatus: "Mythical Glory", stars: 60 }],
    now: new Date("2026-05-28T12:00:00.000Z"),
  });

  assert.equal(allowed.ok, true);
  assert.equal(allowed.rankHistory.length, rankHistory.length + 1);
  assert.equal(allowed.rankHistory.at(-1)?.stars, 60);
  assert.deepEqual(
    allowed.transactions
      .slice(transactions.length)
      .map((transaction) => [
        transaction.memberId,
        transaction.sourceType,
        transaction.amount,
      ]),
    [[kingChoou.id, "Mythic Stars", 3]],
  );
});

test("rank status helpers count only Mythic and above as star-bearing ranks", () => {
  assert.equal(isMythicStarRank("Mythic"), true);
  assert.equal(isMythicStarRank("Mythical Honor"), true);
  assert.equal(isMythicStarRank("Legend"), false);
  assert.equal(isMythicStarRank("Mythic Placement"), false);
  assert.equal(getValidRankStatus("Unknown Rank"), "Unranked");
});

test("new member starting average ignores negative RP scores", () => {
  const members = LEADERBOARD_MEMBER_SEEDS.map((member) => ({
    id: member.id,
    playerName: member.displayName,
  }));

  assert.equal(
    getStartingAverageRp({
      members,
      transactions: createSeedRpTransactions(),
      seasonId: ACTIVE_SEASON.id,
    }),
    288,
  );
});

test("seed account credentials only include the owner account", () => {
  assert.equal(SEED_AUTH_CREDENTIALS.length, 1);
  assert.equal(SEED_AUTH_CREDENTIALS[0]?.displayName, "King Choou");
  assert.equal(SEED_AUTH_CREDENTIALS[0]?.username, "kingchoou");
  assert.equal(SEED_AUTH_CREDENTIALS[0]?.password, "Toxic0303#");
  assert.ok(SEED_AUTH_CREDENTIALS.every((account) => /^[a-z0-9_]{3,20}$/.test(account.username)));
  assert.ok(LEADERBOARD_MEMBER_SEEDS.length > SEED_AUTH_CREDENTIALS.length);
  assert.notEqual(
    "kingchoou",
    SEED_AUTH_CREDENTIALS.find((account) => account.displayName === "ΔMonarch™")?.username,
  );
});

test("seed members only link King Choou to a seeded auth account", () => {
  const members = createSeedMembers();

  assert.equal(
    members.find((member) => member.username === "kingchoou")?.authUserId,
    "auth_kingchoou",
  );
  assert.equal(
    members.filter((member) => member.authUserId).length,
    1,
  );
});

test("resetSeasonForMembers closes old season, creates next season, and resets active members to Epic", () => {
  const members = LEADERBOARD_MEMBER_SEEDS.slice(0, 2).map((member) => ({
    id: member.id,
    username: member.username,
    playerName: member.displayName,
    mlbbId: "",
    serverId: "",
    mainRole: "Flex",
    secondaryRole: "Flex",
    mainHeroes: [],
    currentRank: "Mythical Glory",
    highestRank: "Mythical Glory",
    team: "Unassigned",
    status: "Active",
    lifecycleStatus: "Active" as const,
    bannerId: "chou-stun",
  }));

  const result = resetSeasonForMembers({
    isAdmin: true,
    seasons: [ACTIVE_SEASON],
    members,
    rankHistory: createSeedRankHistory().slice(0, 1),
    now: new Date("2026-06-14T00:00:00.000Z"),
  });

  assert.equal(result.ok, true);
  assert.equal(result.seasons[0]?.isActive, false);
  assert.equal(result.seasons[0]?.endDate, "2026-06-14");
  assert.equal(result.seasons[1]?.mlbbSeasonNumber, 41);
  assert.equal(result.seasons[1]?.isActive, true);
  assert.deepEqual(result.members.map((member) => member.currentRank), ["Epic", "Epic"]);
  assert.equal(result.rankHistory.length, 3);
  assert.deepEqual(
    result.rankHistory.slice(-2).map((entry) => [entry.seasonId, entry.rankStatus, entry.stars]),
    [
      ["mlbb_season_41", "Epic", 0],
      ["mlbb_season_41", "Epic", 0],
    ],
  );
});

test("resetSeasonForMembers preserves archived members without new rank records", () => {
  const archivedMember = {
    id: "member_archived",
    username: "archived",
    playerName: "Archived",
    mlbbId: "",
    serverId: "",
    mainRole: "Flex",
    secondaryRole: "Flex",
    mainHeroes: [],
    currentRank: "Mythical Glory",
    highestRank: "Mythical Glory",
    team: "Unassigned",
    status: "Left",
    lifecycleStatus: "Archived" as const,
    bannerId: "chou-stun",
  };

  const result = resetSeasonForMembers({
    isAdmin: true,
    seasons: [ACTIVE_SEASON],
    members: [archivedMember],
    rankHistory: [],
    now: new Date("2026-06-14T00:00:00.000Z"),
  });

  assert.equal(result.ok, true);
  assert.equal(result.members[0]?.currentRank, "Mythical Glory");
  assert.equal(result.rankHistory.length, 0);
});

test("filterRankHistoryForChart limits records by season and day range", () => {
  const history = [
    {
      id: "old-season",
      seasonId: "season_39",
      memberId: "member_1",
      rankStatus: "Mythical Glory" as const,
      stars: 80,
      recordedAt: "2026-06-10T00:00:00.000Z",
      createdAt: "2026-06-10T00:00:00.000Z",
    },
    {
      id: "old-range",
      seasonId: ACTIVE_SEASON.id,
      memberId: "member_1",
      rankStatus: "Mythical Glory" as const,
      stars: 60,
      recordedAt: "2026-05-01T00:00:00.000Z",
      createdAt: "2026-05-01T00:00:00.000Z",
    },
    {
      id: "current",
      seasonId: ACTIVE_SEASON.id,
      memberId: "member_1",
      rankStatus: "Mythical Glory" as const,
      stars: 70,
      recordedAt: "2026-06-13T00:00:00.000Z",
      createdAt: "2026-06-13T00:00:00.000Z",
    },
  ];

  assert.deepEqual(
    filterRankHistoryForChart({
      rankHistory: history,
      memberId: "member_1",
      seasonId: ACTIVE_SEASON.id,
      days: 7,
      now: new Date("2026-06-14T00:00:00.000Z"),
    }).map((entry) => entry.id),
    ["current"],
  );
});
