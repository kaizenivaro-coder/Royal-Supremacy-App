import React, { useEffect, useState } from "react";
import { publicAsset } from "../lib/publicAssets";
import { cn } from "../lib/utils";

interface HeroIconProps {
  heroName: string;
  className?: string;
}

export function HeroIcon({ heroName, className }: HeroIconProps) {
  const [error, setError] = useState(false);
  const formattedName = formatHeroIconName(heroName);

  useEffect(() => {
    setError(false);
  }, [formattedName]);

  // Assuming icons could be uploaded by the user to public/heroes/
  const imgUrl = publicAsset(`heroes/${formattedName}.png`);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface border border-white/10 text-white font-black uppercase text-[10px] tracking-widest",
          className,
        )}
        title={heroName}
      >
        {heroName.substring(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-md overflow-hidden bg-surface flex items-center justify-center border border-white/5",
        className,
      )}
      title={heroName}
    >
      <img
        src={imgUrl}
        alt={heroName}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function formatHeroIconName(heroName: string) {
  return heroName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
