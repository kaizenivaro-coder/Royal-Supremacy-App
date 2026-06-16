import { cn } from "../lib/utils";
import { getRankIcon } from "../lib/ranks";

type RankIconProps = {
  rankName: string | undefined;
  className?: string;
};

export function RankIcon({ rankName, className }: RankIconProps) {
  const rank = getRankIcon(rankName);

  if (!rank) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-lg border border-blue-200/10 bg-background/60 text-xs font-black uppercase text-text-muted",
          className,
        )}
        aria-label={`${rankName ?? "Unknown"} rank emblem unavailable`}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={rank.iconSrc}
      alt={`${rank.name} rank emblem`}
      className={cn("object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]", className)}
      loading="eager"
    />
  );
}
