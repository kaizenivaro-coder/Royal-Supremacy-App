import { ImagePlus } from "lucide-react";
import { cn } from "../lib/utils";

export function SquadLogoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg border border-gold/35 bg-background/70 text-gold shadow-[0_0_18px_rgba(242,196,83,0.14)]",
        className,
      )}
      aria-label="Squad logo placeholder"
      title="Squad logo placeholder"
    >
      <ImagePlus className="h-4 w-4" />
    </div>
  );
}
