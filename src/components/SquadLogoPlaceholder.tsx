import { ImagePlus } from "lucide-react";
import { cn } from "../lib/utils";

export function SquadLogoPlaceholder({
  className,
  src,
}: {
  className?: string;
  src?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-lg border border-gold/35 bg-background/70 text-gold shadow-[0_0_18px_rgba(242,196,83,0.14)]",
        className,
      )}
      aria-label={src ? "Squad logo" : "Squad logo placeholder"}
      title={src ? "Squad logo" : "Squad logo placeholder"}
    >
      {src ? (
        <img src={src} alt="Squad logo" className="h-full w-full object-cover" />
      ) : (
        <ImagePlus className="h-4 w-4" />
      )}
    </div>
  );
}
