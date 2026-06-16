import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  KeyRound,
  Mail,
  Pencil,
  Save,
  User,
} from "lucide-react";
import { useAppStore } from "../data/store";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
} from "../components/ui";
import type { Member } from "../types";
import { getActiveMembers, getProfileBanner } from "../lib/mvpApp";
import { HeroIcon } from "../components/HeroIcon";
import { RankIcon } from "../components/RankIcon";
import { validateLocalImageUpload } from "../lib/imageUploads";
import { SQUAD_RANKS } from "../lib/ranks";
import {
  calculateMythicLeaderboard,
  calculateRpLeaderboard,
  filterRankHistoryForChart,
  getLatestRankHistoryByMember,
  getMythicStarScore,
} from "../lib/leaderboard";
import { ACTIVE_SEASON } from "../data/leaderboardSeed";

type MainHeroOption = {
  name: string;
  assetName: string;
};

export const MAIN_HERO_OPTIONS: MainHeroOption[] = [
  { name: "Aamon", assetName: "aamon" },
  { name: "Akai", assetName: "akai" },
  { name: "Aldous", assetName: "aldous" },
  { name: "Alice", assetName: "alice" },
  { name: "Alpha", assetName: "alpha" },
  { name: "Alucard", assetName: "alucard" },
  { name: "Angela", assetName: "angela" },
  { name: "Argus", assetName: "argus" },
  { name: "Arlott", assetName: "arlott" },
  { name: "Atlas", assetName: "atlas" },
  { name: "Aulus", assetName: "aulus" },
  { name: "Aurora", assetName: "aurora" },
  { name: "Badang", assetName: "badang" },
  { name: "Balmond", assetName: "balmond" },
  { name: "Bane", assetName: "bane" },
  { name: "Barats", assetName: "barats" },
  { name: "Baxia", assetName: "baxia" },
  { name: "Beatrix", assetName: "beatrix" },
  { name: "Belerick", assetName: "belerick" },
  { name: "Benedetta", assetName: "benedetta" },
  { name: "Brody", assetName: "brody" },
  { name: "Bruno", assetName: "bruno" },
  { name: "Carmilla", assetName: "carmilla" },
  { name: "Cecilion", assetName: "cecilion" },
  { name: "Chang'e", assetName: "chang_e" },
  { name: "Chip", assetName: "chip" },
  { name: "Chou", assetName: "chou" },
  { name: "Cici", assetName: "cici" },
  { name: "Claude", assetName: "claude" },
  { name: "Clint", assetName: "clint" },
  { name: "Cyclops", assetName: "cyclops" },
  { name: "Diggie", assetName: "diggie" },
  { name: "Dyrroth", assetName: "dyrroth" },
  { name: "Edith", assetName: "edith" },
  { name: "Esmeralda", assetName: "esmeralda" },
  { name: "Estes", assetName: "estes" },
  { name: "Eudora", assetName: "eudora" },
  { name: "Fanny", assetName: "fanny" },
  { name: "Faramis", assetName: "faramis" },
  { name: "Floryn", assetName: "floryn" },
  { name: "Franco", assetName: "franco" },
  { name: "Fredrinn", assetName: "fredrinn" },
  { name: "Freya", assetName: "freya" },
  { name: "Gatotkaca", assetName: "gatotkaca" },
  { name: "Gloo", assetName: "gloo" },
  { name: "Gord", assetName: "gord" },
  { name: "Granger", assetName: "granger" },
  { name: "Grock", assetName: "grock" },
  { name: "Guinevere", assetName: "guinevere" },
  { name: "Gusion", assetName: "gusion" },
  { name: "Hanabi", assetName: "hanabi" },
  { name: "Hanzo", assetName: "hanzo" },
  { name: "Harith", assetName: "harith" },
  { name: "Harley", assetName: "harley" },
  { name: "Hayabusa", assetName: "hayabusa" },
  { name: "Helcurt", assetName: "helcurt" },
  { name: "Hilda", assetName: "hilda" },
  { name: "Hylos", assetName: "hylos" },
  { name: "Irithel", assetName: "irithel" },
  { name: "Ixia", assetName: "ixia" },
  { name: "Jawhead", assetName: "jawhead" },
  { name: "Johnson", assetName: "johnson" },
  { name: "Joy", assetName: "joy" },
  { name: "Julian", assetName: "julian" },
  { name: "Kadita", assetName: "kadita" },
  { name: "Kagura", assetName: "kagura" },
  { name: "Kaja", assetName: "kaja" },
  { name: "Kalea", assetName: "kalea" },
  { name: "Karina", assetName: "karina" },
  { name: "Karrie", assetName: "karrie" },
  { name: "Khaleed", assetName: "khaleed" },
  { name: "Khufra", assetName: "khufra" },
  { name: "Kimmy", assetName: "kimmy" },
  { name: "Lancelot", assetName: "lancelot" },
  { name: "Lapu-Lapu", assetName: "lapu_lapu" },
  { name: "Layla", assetName: "layla" },
  { name: "Leomord", assetName: "leomord" },
  { name: "Lesley", assetName: "lesley" },
  { name: "Ling", assetName: "ling" },
  { name: "Lolita", assetName: "lolita" },
  { name: "Lukas", assetName: "lukas" },
  { name: "Lunox", assetName: "lunox" },
  { name: "Luo Yi", assetName: "luo_yi" },
  { name: "Lylia", assetName: "lylia" },
  { name: "Marcel", assetName: "marcel" },
  { name: "Martis", assetName: "martis" },
  { name: "Masha", assetName: "masha" },
  { name: "Mathilda", assetName: "mathilda" },
  { name: "Melissa", assetName: "melissa" },
  { name: "Minotaur", assetName: "minotaur" },
  { name: "Minsitthar", assetName: "minsitthar" },
  { name: "Miya", assetName: "miya" },
  { name: "Moskov", assetName: "moskov" },
  { name: "Nana", assetName: "nana" },
  { name: "Natalia", assetName: "natalia" },
  { name: "Natan", assetName: "natan" },
  { name: "Nolan", assetName: "nolan" },
  { name: "Novaria", assetName: "novaria" },
  { name: "Obsidia", assetName: "obsidia" },
  { name: "Odette", assetName: "odette" },
  { name: "Paquito", assetName: "paquito" },
  { name: "Pharsa", assetName: "pharsa" },
  { name: "Phoveus", assetName: "phoveus" },
  { name: "Popol and Kupa", assetName: "popol_and_kupa" },
  { name: "Rafaela", assetName: "rafaela" },
  { name: "Roger", assetName: "roger" },
  { name: "Ruby", assetName: "ruby" },
  { name: "Saber", assetName: "saber" },
  { name: "Selena", assetName: "selena" },
  { name: "Silvanna", assetName: "silvanna" },
  { name: "Sora", assetName: "sora" },
  { name: "Sun", assetName: "sun" },
  { name: "Suyou", assetName: "suyou" },
  { name: "Terizla", assetName: "terizla" },
  { name: "Thamuz", assetName: "thamuz" },
  { name: "Tigreal", assetName: "tigreal" },
  { name: "Uranus", assetName: "uranus" },
  { name: "Vale", assetName: "vale" },
  { name: "Valentina", assetName: "valentina" },
  { name: "Valir", assetName: "valir" },
  { name: "Vexana", assetName: "vexana" },
  { name: "Wanwan", assetName: "wanwan" },
  { name: "X.Borg", assetName: "x_borg" },
  { name: "Xavier", assetName: "xavier" },
  { name: "Yi Sun-shin", assetName: "yi_sun_shin" },
  { name: "Yin", assetName: "yin" },
  { name: "Yu Zhong", assetName: "yu_zhong" },
  { name: "Yve", assetName: "yve" },
  { name: "Zetian", assetName: "zetian" },
  { name: "Zhask", assetName: "zhask" },
  { name: "Zhuxin", assetName: "zhuxin" },
  { name: "Zilong", assetName: "zilong" },
];

function normalizeHeroSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function filterMainHeroOptions(query: string) {
  const normalizedQuery = normalizeHeroSearch(query);
  if (!normalizedQuery) return MAIN_HERO_OPTIONS;

  return MAIN_HERO_OPTIONS.filter((hero) =>
    normalizeHeroSearch(`${hero.name} ${hero.assetName}`).includes(normalizedQuery),
  );
}

function useProfileDialogState(isOpen: boolean, onClose: () => void) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const animationFrame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(animationFrame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return undefined;

    const scrollY = window.scrollY;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      window.removeEventListener("keydown", handleKeyDown);
      window.scrollTo(0, scrollY);
    };
  }, [onClose, shouldRender]);

  return { shouldRender, isVisible };
}

type FocusedProfileDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  ariaLabel: string;
  onClose: () => void;
  search?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

function FocusedProfileDialog({
  isOpen,
  title,
  description,
  ariaLabel,
  onClose,
  search,
  footer,
  children,
}: FocusedProfileDialogProps) {
  const { shouldRender, isVisible } = useProfileDialogState(isOpen, onClose);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-3 py-5 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={`flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-blue-200/20 bg-surface shadow-2xl transition-all duration-200 ease-in-out md:max-h-[78vh] md:w-[70vw] ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/60"
              aria-label={`Close ${ariaLabel}`}
            >
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-black uppercase tracking-widest text-gold">
                {title}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {description}
              </p>
            </div>
          </div>
          {search}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-5 md:p-5">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-white/10 px-3 py-3 text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type ProfilePictureLightboxProps = {
  isOpen: boolean;
  imageSrc?: string;
  playerName?: string;
  username?: string;
  imageError?: string;
  onClose: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ProfilePictureLightbox({
  isOpen,
  imageSrc,
  playerName,
  username,
  imageError,
  onClose,
  onUpload,
}: ProfilePictureLightboxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fallbackInitial = playerName?.substring(0, 1).toUpperCase() || "?";

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex min-h-screen flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Profile picture"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/60"
          aria-label="Close profile picture"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="min-w-0 flex-1 px-3 text-left">
          <h2 className="truncate text-xl font-medium normal-case tracking-normal text-white">
            Profile picture
          </h2>
          {username && (
            <p className="truncate text-xs font-bold text-text-muted">@{username}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/60"
          aria-label="Edit profile picture"
        >
          <Pencil size={22} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-label="Choose profile picture image"
          onChange={onUpload}
        />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${playerName ?? "Player"} profile picture`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="grid h-44 w-44 place-items-center rounded-2xl border border-gold/30 bg-surface text-7xl font-black text-white shadow-2xl md:h-64 md:w-64">
            {fallbackInitial}
          </div>
        )}
      </div>

      {imageError && (
        <div className="border-t border-danger/25 bg-danger/10 px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-danger">
          {imageError}
        </div>
      )}
    </div>
  );
}

type MainHeroPickerDialogProps = {
  isOpen: boolean;
  selectedHeroes: string[];
  onClose: () => void;
  onSave: (heroes: string[]) => void;
};

export function MainHeroPickerDialog({
  isOpen,
  selectedHeroes,
  onClose,
  onSave,
}: MainHeroPickerDialogProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftHeroes, setDraftHeroes] = useState<string[]>(selectedHeroes);
  const filteredHeroes = filterMainHeroOptions(searchQuery);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setDraftHeroes(selectedHeroes);
      const animationFrame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(animationFrame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timeout);
  }, [isOpen, selectedHeroes]);

  useEffect(() => {
    if (!shouldRender) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, shouldRender]);

  if (!shouldRender) return null;

  const toggleHero = (heroName: string) => {
    setDraftHeroes((currentHeroes) =>
      currentHeroes.includes(heroName)
        ? currentHeroes.filter((hero) => hero !== heroName)
        : [...currentHeroes, heroName],
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/72 px-3 py-5 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Main Heroes"
    >
      <div
        className={`flex h-[82vh] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-blue-200/20 bg-surface shadow-2xl transition-all duration-200 ease-in-out md:h-[70vh] md:w-[70vw] ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold/60"
              aria-label="Close main hero picker"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-black uppercase tracking-widest text-gold">
                Main Heroes
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Select the heroes you play most
              </p>
            </div>
          </div>

          <div className="ml-auto w-full md:mr-1 md:w-[20%] md:min-w-44 md:max-w-60">
            <Input
              type="search"
              aria-label="Search heroes"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 text-xs"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {filteredHeroes.map((hero) => {
              const isSelected = draftHeroes.includes(hero.name);

              return (
                <button
                  key={hero.assetName}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleHero(hero.name)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                    isSelected
                      ? "border-gold/70 bg-gold/10"
                      : "border-blue-200/10 bg-background/45 hover:border-gold/35"
                  }`}
                >
                  <HeroIcon
                    heroName={hero.name}
                    className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-black uppercase tracking-wide text-white">
                    {hero.name}
                  </span>
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
                      isSelected
                        ? "border-gold bg-gold text-background"
                        : "border-blue-200/25 bg-surface-hover"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check size={15} strokeWidth={4} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-4 text-center">
          <Button
            type="button"
            variant="gold"
            onClick={() => onSave(draftHeroes)}
            className="mx-auto min-w-48 gap-2"
          >
            Save Main Heroes
          </Button>
        </div>
      </div>
    </div>
  );
}

type ProfileIdentityDialogProps = {
  isOpen: boolean;
  formData: Partial<Member>;
  authUsername: string | undefined;
  accountEmail: string;
  newPassword: string;
  accountError: string;
  showSuccess: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onInputChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onAccountEmailChange: (email: string) => void;
  onNewPasswordChange: (password: string) => void;
};

export function ProfileIdentityDialog({
  isOpen,
  formData,
  authUsername,
  accountEmail,
  newPassword,
  accountError,
  showSuccess,
  isSaving,
  onClose,
  onSubmit,
  onInputChange,
  onAccountEmailChange,
  onNewPasswordChange,
}: ProfileIdentityDialogProps) {
  return (
    <FocusedProfileDialog
      isOpen={isOpen}
      title="Identity"
      description="Update account, player, rank, role, and hero details"
      ariaLabel="Identity"
      onClose={onClose}
      footer={
        <Button
          form="profile-identity-form"
          type="submit"
          variant="gold"
          disabled={isSaving}
          className="mx-auto min-w-56 gap-2"
        >
          {isSaving ? "Saving..." : "Save Profile"}
          <Save size={18} />
        </Button>
      }
    >
      <form id="profile-identity-form" onSubmit={onSubmit} className="space-y-6">
        {showSuccess && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center text-xs font-black uppercase tracking-widest text-success">
            Profile settings updated
          </div>
        )}
        {accountError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-center text-xs font-black uppercase tracking-widest text-danger">
            {accountError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 border-b border-white/5 pb-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
              <Input
                value={authUsername ?? ""}
                readOnly
                autoCapitalize="none"
                spellCheck={false}
                className="pl-11 font-black lowercase text-gold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Connected Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
              <Input
                type="email"
                value={accountEmail}
                onChange={(event) => onAccountEmailChange(event.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                className="pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/75" />
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                autoComplete="new-password"
                className="pl-11"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Operator Handle</Label>
            <Input
              name="playerName"
              value={formData.playerName || ""}
              onChange={onInputChange}
              required
              className="font-black uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label>MLBB ID</Label>
            <Input
              name="mlbbId"
              value={formData.mlbbId || ""}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Server / Zone ID</Label>
            <Input
              name="serverId"
              value={formData.serverId || ""}
              onChange={onInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Tactical Role</Label>
            <Select
              name="mainRole"
              value={formData.mainRole || ""}
              onChange={onInputChange}
            >
              <option>Gold Lane</option>
              <option>EXP Lane</option>
              <option>Mid Lane</option>
              <option>Jungle</option>
              <option>Roam</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Secondary Flex Role</Label>
            <Select
              name="secondaryRole"
              value={formData.secondaryRole || ""}
              onChange={onInputChange}
            >
              <option>Gold Lane</option>
              <option>EXP Lane</option>
              <option>Mid Lane</option>
              <option>Jungle</option>
              <option>Roam</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-white/5 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Current Rank</Label>
            <div className="flex items-center gap-3 rounded-lg border border-blue-200/10 bg-background/35 p-3">
              <RankIcon rankName={formData.currentRank} className="h-14 w-14 shrink-0" />
              <Select
                name="currentRank"
                value={formData.currentRank || SQUAD_RANKS[0].name}
                onChange={onInputChange}
                className="min-w-0 font-black"
              >
                {SQUAD_RANKS.map((rank) => (
                  <option key={rank.id}>{rank.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Peak Rank</Label>
            <div className="flex items-center gap-3 rounded-lg border border-blue-200/10 bg-background/35 p-3">
              <RankIcon rankName={formData.highestRank} className="h-14 w-14 shrink-0" />
              <Select
                name="highestRank"
                value={formData.highestRank || SQUAD_RANKS[0].name}
                onChange={onInputChange}
                className="min-w-0 font-black"
              >
                {SQUAD_RANKS.map((rank) => (
                  <option key={rank.id}>{rank.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </form>
    </FocusedProfileDialog>
  );
}

type ProfileMainHeroesCardProps = {
  heroes: string[] | undefined;
  onOpen: () => void;
};

export function ProfileMainHeroesCard({
  heroes = [],
  onOpen,
}: ProfileMainHeroesCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-lg border border-blue-200/10 bg-surface/88 p-5 text-left shadow-xl transition duration-200 hover:border-gold/35 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-gold/60"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Heroes
          </p>
          <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
            Main Heroes
          </h2>
        </div>
        <span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gold">
          {heroes.length} selected
        </span>
      </div>

      {heroes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {heroes.map((hero) => (
            <div key={hero} className="flex flex-col items-center gap-2">
              <HeroIcon
                heroName={hero}
                className="h-12 w-12 rounded-full border-2 border-white/10"
              />
              <span className="max-w-16 truncate text-[9px] font-black uppercase text-text-muted">
                {hero}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-text-muted">
          No main heroes selected.
        </p>
      )}

      <span className="mt-5 inline-flex rounded-lg border border-blue-200/15 bg-background/45 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white">
        Choose Main Heroes
      </span>
    </button>
  );
}

type ProfileLeaderboardStatsProps = {
  currentRp: number;
  rpRank: number | null;
  mythicStars: number;
  mythicRankPosition: number | null;
  history: { recordedAt: string; stars: number }[];
  historyRangeDays: HistoryRangeDays;
  onHistoryRangeChange: (days: HistoryRangeDays) => void;
  seasons: { id: string; name: string }[];
  selectedSeasonId: string;
  onSelectedSeasonChange: (seasonId: string) => void;
};

const HISTORY_RANGE_OPTIONS = [7, 14, 30, 60, 90] as const;
type HistoryRangeDays = (typeof HISTORY_RANGE_OPTIONS)[number];

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-blue-200/10 bg-background/45 p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">{value}</p>
    </div>
  );
}

function buildStarHistoryPoints(history: { stars: number }[]) {
  if (!history.length) return [];

  const safeHistory = history.length ? history : [{ stars: 0 }];
  const values =
    safeHistory.length === 1
      ? [safeHistory[0].stars, safeHistory[0].stars]
      : safeHistory.map((entry) => entry.stars);
  const max =
    safeHistory.length === 1 ? safeHistory[0].stars + 1 : Math.max(...values, 1);
  const min =
    safeHistory.length === 1 ? safeHistory[0].stars - 1 : Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const width = 232;
  const xPadding = 14;
  const height = 88;

  return values.map((value, index) => {
    const x =
      xPadding + (values.length === 1 ? 0 : (index / (values.length - 1)) * width);
    const y = height - ((value - min) / range) * (height - 12) - 6;
    return { x, y };
  });
}

export function ProfileLeaderboardStats({
  currentRp,
  rpRank,
  mythicStars,
  mythicRankPosition,
  history,
  historyRangeDays,
  onHistoryRangeChange,
  seasons,
  selectedSeasonId,
  onSelectedSeasonChange,
}: ProfileLeaderboardStatsProps) {
  const chartPoints = buildStarHistoryPoints(history);
  const points = chartPoints
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  return (
    <Card className="p-5">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Current RP" value={currentRp} />
        <StatTile label="RP Rank" value={rpRank ? `#${rpRank}` : "Unranked"} />
        <StatTile label="Current Mythic Stars" value={mythicStars} />
        <StatTile
          label="Mythic Rank Position"
          value={mythicRankPosition ? `#${mythicRankPosition}` : "No Stars"}
        />
      </div>
      <div className="mt-5 rounded-lg border border-blue-200/10 bg-background/45 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gold">
            Mythic Star History
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            {history.length} Records
          </span>
        </div>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-blue-200/10 bg-black/20 p-1">
            {HISTORY_RANGE_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onHistoryRangeChange(days)}
                className={`rounded-md px-2 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                  historyRangeDays === days
                    ? "bg-gold text-background"
                    : "text-text-muted hover:bg-white/10 hover:text-white"
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
          <Select
            value={selectedSeasonId}
            onChange={(event) => onSelectedSeasonChange(event.target.value)}
            aria-label="History season"
            className="h-10 text-xs"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </Select>
        </div>
        {history.length ? (
          <svg
            viewBox="0 0 260 100"
            role="img"
            aria-label="Mythic star history chart"
            className="h-28 w-full overflow-visible"
          >
            <line
              x1="0"
              y1="94"
              x2="260"
              y2="94"
              stroke="rgba(145,168,199,0.22)"
              strokeWidth="1"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#6dbfff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chartPoints.map((point, index) => (
              <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#f2c453"
                stroke="#071425"
                strokeWidth="2"
              />
            ))}
          </svg>
        ) : (
          <div className="grid h-28 place-items-center rounded-lg border border-dashed border-blue-200/15 bg-black/20 text-center text-xs font-black uppercase tracking-widest text-text-muted">
            No rank records for this range
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Profile() {
  const {
    members,
    setMembers,
    authUser,
    connectEmail,
    changePassword,
    seasons,
    rpTransactions,
    rankHistory,
  } = useAppStore();
  const userProfile =
    members.find((member) => member.username === authUser?.username) ?? members[0];
  const [formData, setFormData] = useState<Partial<Member>>(userProfile ?? {});
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [imageError, setImageError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProfileViewerOpen, setIsProfileViewerOpen] = useState(false);
  const [isHeroPickerOpen, setIsHeroPickerOpen] = useState(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [historyRangeDays, setHistoryRangeDays] = useState<HistoryRangeDays>(7);
  const [selectedHistorySeasonId, setSelectedHistorySeasonId] = useState(ACTIVE_SEASON.id);

  useEffect(() => {
    setFormData(userProfile ?? {});
  }, [userProfile]);

  useEffect(() => {
    setAccountEmail(authUser?.email ?? "");
  }, [authUser?.email]);

  const selectedBanner = getProfileBanner(formData.bannerId);
  const activeSeasonId =
    seasons.find((season) => season.isActive)?.id ?? ACTIVE_SEASON.id;
  const activeMembers = useMemo(() => getActiveMembers(members), [members]);

  useEffect(() => {
    if (!seasons.some((season) => season.id === selectedHistorySeasonId)) {
      setSelectedHistorySeasonId(activeSeasonId);
    }
  }, [activeSeasonId, seasons, selectedHistorySeasonId]);

  const memberRefs = useMemo(
    () => activeMembers.map((member) => ({ id: member.id, playerName: member.playerName })),
    [activeMembers],
  );
  const rpLeaderboard = useMemo(
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
  const latestRankByMember = useMemo(
    () => getLatestRankHistoryByMember(rankHistory, activeSeasonId),
    [activeSeasonId, rankHistory],
  );
  const rpEntry = userProfile
    ? rpLeaderboard.find((entry) => entry.memberId === userProfile.id)
    : undefined;
  const mythicEntry = userProfile
    ? mythicLeaderboard.starEntries.find((entry) => entry.memberId === userProfile.id)
    : undefined;
  const latestRank = userProfile
    ? latestRankByMember.get(userProfile.id)
    : undefined;
  const userRankHistory = userProfile
    ? filterRankHistoryForChart({
        rankHistory,
        memberId: userProfile.id,
        seasonId: selectedHistorySeasonId,
        days: historyRangeDays,
      })
        .map((entry) => ({
          recordedAt: entry.recordedAt,
          stars: getMythicStarScore(entry.rankStatus, entry.stars),
        }))
    : [];

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateLocalImageUpload(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setFormData((previous) => ({ ...previous, profileImageSrc: reader.result as string }));
        setImageError("");
      }
    });
    reader.readAsDataURL(file);
  };

  const saveMemberProfile = (nextFormData: Partial<Member>) => {
    if (!userProfile) return;

    const updatedMembers = members.map((member) =>
      member.id === userProfile.id ? ({ ...member, ...nextFormData } as Member) : member,
    );

    setMembers(updatedMembers);
    setShowSuccess(true);
    window.setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile) return;

    setIsSaving(true);
    setAccountError("");

    const nextEmail = accountEmail.trim();
    const currentEmail = authUser?.email ?? "";

    if (nextEmail && nextEmail !== currentEmail) {
      const result = await connectEmail(nextEmail);
      if (!result.ok) {
        setAccountError(result.error ?? "Could not connect email.");
        setIsSaving(false);
        return;
      }
    }

    if (newPassword) {
      const result = await changePassword(newPassword);
      if (!result.ok) {
        setAccountError(result.error ?? "Could not update password.");
        setIsSaving(false);
        return;
      }
      setNewPassword("");
    }

    saveMemberProfile(formData);
    setIsSaving(false);
  };

  if (!userProfile) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <ProfilePictureLightbox
        isOpen={isProfileViewerOpen}
        imageSrc={formData.profileImageSrc}
        playerName={formData.playerName}
        username={formData.username}
        imageError={imageError}
        onClose={() => setIsProfileViewerOpen(false)}
        onUpload={handleProfileImageUpload}
      />
      <ProfileIdentityDialog
        isOpen={isIdentityOpen}
        formData={formData}
        authUsername={authUser?.username}
        accountEmail={accountEmail}
        newPassword={newPassword}
        accountError={accountError}
        showSuccess={showSuccess}
        isSaving={isSaving}
        onClose={() => setIsIdentityOpen(false)}
        onSubmit={handleSave}
      onInputChange={handleInputChange}
      onAccountEmailChange={setAccountEmail}
      onNewPasswordChange={setNewPassword}
    />
      <MainHeroPickerDialog
        isOpen={isHeroPickerOpen}
        selectedHeroes={formData.mainHeroes ?? []}
        onClose={() => setIsHeroPickerOpen(false)}
        onSave={(heroes) => {
          setFormData((previous) => ({ ...previous, mainHeroes: heroes }));
          setIsHeroPickerOpen(false);
        }}
      />

      <div className="mb-5">
        <h1 className="text-4xl font-display font-black uppercase text-white md:text-5xl mlbb-title">
          <span className="gold-gradient-text">My Profile</span>
        </h1>
      </div>

      {showSuccess && !isIdentityOpen && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-center text-xs font-black uppercase tracking-widest text-success">
          Profile settings updated
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div
              className="relative min-h-[360px] border-b border-blue-200/10"
              style={{
                backgroundImage: `url(${selectedBanner.src})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/72 to-surface" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.16),transparent_42%)]" />
              <div className="relative flex min-h-[360px] flex-col items-center justify-end px-6 pb-9 pt-24 text-center">
                <button
                  type="button"
                  onClick={() => setIsProfileViewerOpen(true)}
                  className="grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-lg border border-gold/35 bg-background text-4xl font-black text-white shadow-2xl shadow-black/50 transition hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold/60"
                  aria-label="Open profile picture"
                >
                  {formData.profileImageSrc ? (
                    <img
                      src={formData.profileImageSrc}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    formData.playerName?.substring(0, 1).toUpperCase() || "?"
                  )}
                </button>
                <h2 className="mt-5 text-2xl font-black uppercase text-white drop-shadow-lg">
                  {formData.playerName}
                </h2>
                <p className="mt-1 text-xs font-black text-gold">@{formData.username}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Badge variant="purple">{formData.team}</Badge>
                  <Badge variant="success">{formData.status}</Badge>
                </div>
              </div>
            </div>
            <div className="bg-surface/95 p-6 text-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-blue-200/10 bg-background/45 p-3">
                  <RankIcon
                    rankName={formData.currentRank}
                    className="mx-auto h-14 w-14"
                  />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Current Rank
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {formData.currentRank}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200/10 bg-background/45 p-3">
                  <RankIcon
                    rankName={formData.highestRank}
                    className="mx-auto h-14 w-14"
                  />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Peak Rank
                  </p>
                  <p className="mt-1 text-sm font-black text-purple-light">
                    {formData.highestRank}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <ProfileLeaderboardStats
            currentRp={rpEntry?.score ?? 0}
            rpRank={rpEntry?.rank ?? null}
            mythicStars={getMythicStarScore(latestRank?.rankStatus, latestRank?.stars ?? 0)}
            mythicRankPosition={mythicEntry?.rank ?? null}
            history={userRankHistory}
            historyRangeDays={historyRangeDays}
            onHistoryRangeChange={setHistoryRangeDays}
            seasons={seasons}
            selectedSeasonId={selectedHistorySeasonId}
            onSelectedSeasonChange={setSelectedHistorySeasonId}
          />
        </div>

        <div className="content-start space-y-4">
          <button
            type="button"
            onClick={() => setIsIdentityOpen(true)}
            className="block w-full rounded-lg border border-blue-200/10 bg-surface/88 p-5 text-left shadow-xl transition duration-200 hover:border-gold/35 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Account
            </p>
            <h2 className="mt-1 font-display text-2xl font-black uppercase text-white">
              Identity
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Handle
                </p>
                <p className="mt-1 truncate text-sm font-black text-gold">
                  @{formData.username}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Role
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {formData.mainRole}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200/10 bg-background/45 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Rank
                </p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {formData.currentRank}
                </p>
              </div>
            </div>
          </button>

          <ProfileMainHeroesCard
            heroes={formData.mainHeroes}
            onOpen={() => setIsHeroPickerOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
