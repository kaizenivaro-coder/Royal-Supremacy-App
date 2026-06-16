import { publicAsset } from "./publicAssets";

export type SquadRank = {
  id: string;
  name: string;
  iconSrc: string;
};

export const SQUAD_RANKS: SquadRank[] = [
  {
    id: "unranked",
    name: "Unranked",
    iconSrc: publicAsset("ranks/unranked.png"),
  },
  {
    id: "grandmaster",
    name: "Grandmaster",
    iconSrc: publicAsset("ranks/grandmaster.png"),
  },
  {
    id: "epic",
    name: "Epic",
    iconSrc: publicAsset("ranks/epic.png"),
  },
  {
    id: "legend",
    name: "Legend",
    iconSrc: publicAsset("ranks/legend.png"),
  },
  {
    id: "mythic",
    name: "Mythic",
    iconSrc: publicAsset("ranks/mythic.png"),
  },
  {
    id: "mythical-honor",
    name: "Mythical Honor",
    iconSrc: publicAsset("ranks/mythical-honor.png"),
  },
  {
    id: "mythical-glory",
    name: "Mythical Glory",
    iconSrc: publicAsset("ranks/mythical-glory.png"),
  },
  {
    id: "mythical-immortal",
    name: "Mythical Immortal",
    iconSrc: publicAsset("ranks/mythical-immortal.png"),
  },
];

export const MYTHIC_RANKS = SQUAD_RANKS.filter((rank) =>
  rank.id.startsWith("mythic"),
);

function normalizeRankName(rankName: string) {
  return rankName.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRankIcon(rankName: string | undefined) {
  if (!rankName) return SQUAD_RANKS[0];

  const normalizedRankName = normalizeRankName(rankName);

  return (
    SQUAD_RANKS.find(
      (rank) => normalizeRankName(rank.name) === normalizedRankName,
    ) ?? SQUAD_RANKS[0]
  );
}
