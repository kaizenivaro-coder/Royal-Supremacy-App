import { useMemo, useState } from "react";
import { Crown, Gem, Medal, Shield, Sparkles, Trophy } from "lucide-react";
import { Badge, Button, Card } from "../components/ui";
import { SquadLogoPlaceholder } from "../components/SquadLogoPlaceholder";
import { useAppStore } from "../data/store";
import {
  LeaderboardEntry,
  calculateMythicLeaderboard,
  calculateRpLeaderboard,
} from "../lib/leaderboard";
import { ACTIVE_SEASON } from "../data/leaderboardSeed";
import { getActiveMembers } from "../lib/mvpApp";

type LeaderboardMode = "rp" | "mythic";

type LeaderboardCommandBoardProps = {
  mode: LeaderboardMode;
  entries: LeaderboardEntry[];
  placementEntries: LeaderboardEntry[];
  noStarEntries: LeaderboardEntry[];
  lastUpdated: string;
  squadLogoSrc: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "2026-05-28";
  return date.toISOString().slice(0, 10);
}

function getRankTone(rank: number) {
  if (rank === 1) {
    return {
      label: "1",
      className:
        "border-gold/70 bg-gold/20 text-gold shadow-[0_0_30px_rgba(242,196,83,0.22)]",
      icon: Crown,
    };
  }

  if (rank === 2) {
    return {
      label: "2",
      className:
        "border-blue-200/45 bg-blue-300/12 text-blue-100 shadow-[0_0_24px_rgba(109,191,255,0.16)]",
      icon: Medal,
    };
  }

  if (rank === 3) {
    return {
      label: "3",
      className:
        "border-amber-700/70 bg-amber-800/20 text-amber-300 shadow-[0_0_24px_rgba(180,83,9,0.18)]",
      icon: Shield,
    };
  }

  return {
    label: String(rank),
    className: "border-blue-200/15 bg-background/70 text-white",
    icon: Trophy,
  };
}

function RankBadge({ rank }: { rank: number }) {
  const tone = getRankTone(rank);
  const Icon = tone.icon;

  return (
    <div
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border ${tone.className}`}
      aria-label={`Rank ${rank}`}
    >
      {rank <= 3 ? <Icon className="h-6 w-6" /> : <span className="text-sm font-black">{rank}</span>}
    </div>
  );
}

function TopThreeCards({
  entries,
  unitLabel,
}: {
  entries: LeaderboardEntry[];
  unitLabel: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-gold">
        <Sparkles className="h-4 w-4" />
        Top 3
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {entries.slice(0, 3).map((entry) => {
          const tone = getRankTone(entry.rank);
          const Icon = tone.icon;

          return (
            <div
              key={entry.memberId}
              className={`relative overflow-hidden rounded-lg border bg-background/58 p-4 ${tone.className}`}
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/10 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-text-muted">
                    Rank {entry.rank}
                  </p>
                  <h3 className="mt-2 text-xl font-black leading-tight text-white md:text-2xl">
                    {entry.displayName}
                  </h3>
                </div>
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-current/35 bg-black/35">
                  <Icon className="h-8 w-8" />
                </div>
              </div>
              <div className="relative mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  {unitLabel}
                </span>
                <span className="font-display text-3xl font-black text-white">
                  {entry.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RankedRows({
  entries,
  unitLabel,
}: {
  entries: LeaderboardEntry[];
  unitLabel: string;
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.memberId}
          className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-lg border border-blue-200/10 bg-background/58 px-3 py-3 shadow-lg shadow-black/20"
        >
          <RankBadge rank={entry.rank} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white md:text-base">
              {entry.displayName}
            </p>
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-text-muted">
              {unitLabel}
            </p>
          </div>
          <div className="min-w-16 text-right font-display text-xl font-black text-gold">
            {entry.score}
          </div>
        </div>
      ))}
    </div>
  );
}

function SecondaryRankSection({
  title,
  entries,
}: {
  title: string;
  entries: LeaderboardEntry[];
}) {
  if (!entries.length) return null;

  return (
    <div className="rounded-lg border border-blue-200/10 bg-background/45 p-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-text-muted">
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry) => (
          <Badge key={entry.memberId} variant="purple" className="rounded-lg py-1">
            {entry.displayName}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardCommandBoard({
  mode,
  entries,
  placementEntries,
  noStarEntries,
  lastUpdated,
  squadLogoSrc,
}: LeaderboardCommandBoardProps) {
  const isRp = mode === "rp";
  const subtitle = isRp ? "Current RP Standings" : "Current Mythic Star Standings";
  const unitLabel = isRp ? "RP" : "Stars";

  return (
    <Card className="relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(39,100,210,0.22),transparent_36%),linear-gradient(120deg,rgba(242,196,83,0.08),transparent_24%,rgba(49,133,255,0.1)_78%,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="relative p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="relative grid h-20 w-20 place-items-center rounded-lg border border-gold/45 bg-background/70 shadow-[0_0_36px_rgba(242,196,83,0.18)]">
            <SquadLogoPlaceholder src={squadLogoSrc} className="h-16 w-16" />
          </div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.34em] text-blue-100">
            Royal Supremacy
          </p>
          <h2 className="mt-1 font-display text-3xl font-black uppercase text-white mlbb-title sm:text-5xl">
            Royal Supremacy Leaderboard
          </h2>
          <div className="mt-4 rounded-lg border border-gold/30 bg-background/60 px-5 py-3">
            <p className="font-display text-lg font-black uppercase tracking-wider text-gold">
              {subtitle}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-text-muted">
              Updated from Admin Portal
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-blue-200/15 bg-surface-hover/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
            Date: {formatDate(lastUpdated)}
          </div>
        </div>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

        <div className="space-y-6">
          <TopThreeCards entries={entries} unitLabel={unitLabel} />

          <section>
            <div className="mb-3 grid grid-cols-[56px_1fr_auto] gap-3 rounded-lg border border-gold/35 bg-gold/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gold">
              <span>Rank</span>
              <span>Member</span>
              <span>{unitLabel}</span>
            </div>
            <RankedRows entries={entries.slice(3)} unitLabel={unitLabel} />
          </section>

          {!isRp && (
            <div className="grid gap-3 lg:grid-cols-2">
              <SecondaryRankSection
                title="Mythic Placement"
                entries={placementEntries}
              />
              <SecondaryRankSection
                title="Not Ranked / No Stars"
                entries={noStarEntries}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function getLastUpdated(values: string[]) {
  const sorted = values
    .filter(Boolean)
    .sort((first, second) => new Date(second).getTime() - new Date(first).getTime());

  return sorted[0] ?? new Date().toISOString();
}

export default function Leaderboard() {
  const { members, rpTransactions, rankHistory, seasons, squadLogoSrc } = useAppStore();
  const [mode, setMode] = useState<LeaderboardMode>("rp");
  const activeSeasonId =
    seasons.find((season) => season.isActive)?.id ?? ACTIVE_SEASON.id;
  const activeMembers = useMemo(() => getActiveMembers(members), [members]);
  const memberRefs = useMemo(
    () => activeMembers.map((member) => ({ id: member.id, playerName: member.playerName })),
    [activeMembers],
  );
  const rpEntries = useMemo(
    () =>
      calculateRpLeaderboard({
        members: memberRefs,
        transactions: rpTransactions,
        seasonId: activeSeasonId,
      }),
    [activeSeasonId, memberRefs, rpTransactions],
  );
  const mythicLeaderboard = useMemo(
    () =>
      calculateMythicLeaderboard({
        members: memberRefs,
        rankHistory,
        seasonId: activeSeasonId,
      }),
    [activeSeasonId, memberRefs, rankHistory],
  );
  const lastUpdated = useMemo(
    () =>
      getLastUpdated([
        ...rpTransactions.map((transaction) => transaction.occurredAt),
        ...rankHistory.map((history) => history.recordedAt),
      ]),
    [rankHistory, rpTransactions],
  );
  const currentEntries = mode === "rp" ? rpEntries : mythicLeaderboard.starEntries;

  return (
    <div className="space-y-6 pb-10 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">
            Squad Command
          </p>
          <h1 className="mt-1 font-display text-4xl font-black uppercase text-white mlbb-title md:text-5xl">
            Leaderboard
          </h1>
        </div>
        <div className="flex rounded-lg border border-blue-200/10 bg-surface p-1">
          <Button
            type="button"
            variant={mode === "rp" ? "gold" : "ghost"}
            size="sm"
            onClick={() => setMode("rp")}
            className="gap-2"
          >
            <Gem className="h-4 w-4" />
            Royal Points
          </Button>
          <Button
            type="button"
            variant={mode === "mythic" ? "gold" : "ghost"}
            size="sm"
            onClick={() => setMode("mythic")}
            className="gap-2"
          >
            <Crown className="h-4 w-4" />
            Mythic Stars
          </Button>
        </div>
      </div>

      <LeaderboardCommandBoard
        mode={mode}
        entries={currentEntries}
        placementEntries={mythicLeaderboard.placementEntries}
        noStarEntries={mythicLeaderboard.noStarEntries}
        lastUpdated={lastUpdated}
        squadLogoSrc={squadLogoSrc}
      />
    </div>
  );
}
