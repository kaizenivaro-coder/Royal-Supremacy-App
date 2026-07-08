import { useMemo, useRef, useState } from "react";
import {
  Check,
  Eraser,
  Eye,
  LockKeyhole,
  Map,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { HeroIcon } from "../components/HeroIcon";
import { Button, Input } from "../components/ui";
import { useAppStore } from "../data/store";
import {
  canEditPublicStrategy,
  moveStrategyPlacement,
  placeStrategyHero,
  removeStrategyPlacement,
  toggleStrategyEditor,
} from "../lib/strategy";
import { MAIN_HERO_OPTIONS } from "./Profile";
import type { StrategyPlacement } from "../types";

type Room = "private" | "public";

export default function StrategyRoom() {
  const {
    authUser,
    isAdmin,
    members,
    publicStrategyPlacements,
    privateStrategyPlacementsByUser,
    strategyEditorUsernames,
    setPublicStrategyPlacements,
    setPrivateStrategyPlacements,
    setStrategyEditorUsernames,
  } = useAppStore();
  const username = authUser?.username ?? "commander";
  const normalizedUsername = username.toLowerCase();
  const [room, setRoom] = useState<Room>("private");
  const [query, setQuery] = useState("");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [showEditors, setShowEditors] = useState(false);
  const [notice, setNotice] = useState("Changes save automatically on this device.");
  const boardRef = useRef<HTMLDivElement>(null);
  const draggingPlacementRef = useRef<string | null>(null);

  const privatePlacements = privateStrategyPlacementsByUser[normalizedUsername] ?? [];
  const placements = room === "private" ? privatePlacements : publicStrategyPlacements;
  const canEdit = room === "private" || canEditPublicStrategy(
    isAdmin,
    username,
    strategyEditorUsernames,
  );
  const filteredHeroes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? MAIN_HERO_OPTIONS.filter((hero) => hero.name.toLowerCase().includes(normalized))
      : MAIN_HERO_OPTIONS;
  }, [query]);

  const persist = (next: StrategyPlacement[]) => {
    if (room === "private") setPrivateStrategyPlacements(username, next);
    else setPublicStrategyPlacements(next);
  };

  const coordinatesFromEvent = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      xPercent: ((clientX - rect.left) / rect.width) * 100,
      yPercent: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const addHero = (heroId: string, clientX: number, clientY: number) => {
    if (!canEdit) return;
    const hero = MAIN_HERO_OPTIONS.find((option) => option.assetName === heroId);
    const coordinates = coordinatesFromEvent(clientX, clientY);
    if (!hero || !coordinates) return;
    const result = placeStrategyHero(placements, {
      heroId,
      heroName: hero.name,
      ...coordinates,
      actorUsername: username,
    });
    if (result.error) setNotice(result.error);
    else {
      persist(result.placements);
      setSelectedPlacementId(result.placements.at(-1)?.id ?? null);
      setNotice(`${hero.name} added to the ${room} board.`);
    }
    setSelectedHeroId(null);
  };

  const removeSelected = () => {
    if (!selectedPlacementId || !canEdit) return;
    persist(removeStrategyPlacement(placements, selectedPlacementId));
    setSelectedPlacementId(null);
    setNotice("Hero removed from the board.");
  };

  return (
    <section className="strategy-room space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">Tactical command</p>
          <h1 className="font-display text-3xl font-black uppercase text-gold sm:text-4xl mlbb-title">Strategy Room</h1>
        </div>
        <div className="flex rounded-lg border border-blue-200/15 bg-surface p-1">
          {(["private", "public"] as Room[]).map((item) => (
            <button key={item} type="button" onClick={() => { setRoom(item); setSelectedPlacementId(null); }} className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-black uppercase transition ${room === item ? "bg-gold text-black" : "text-text-muted hover:text-white"}`}>
              {item === "private" ? <LockKeyhole size={15} /> : <Users size={15} />}{item}
            </button>
          ))}
        </div>
      </header>

      <div className="rounded-lg border border-blue-200/15 bg-surface/85 p-3 text-sm text-text-muted">
        {room === "private" ? "Your private tactical board. Only this account can view it on this device." : canEdit ? "Squad board editing enabled. Changes are visible to the squad." : "View-only squad strategy. An admin can grant you editor access."}
      </div>

      <div className="strategy-shell grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200/15 bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted"><Map size={16} className="text-gold" />{placements.length} heroes placed</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setNotice("View reset.")}><RotateCcw size={15} /> Reset view</Button>
              <Button variant="secondary" disabled={!canEdit || !selectedPlacementId} onClick={removeSelected}><Trash2 size={15} /> Remove</Button>
              <Button variant="secondary" disabled={!canEdit || placements.length === 0} onClick={() => { persist([]); setSelectedPlacementId(null); setNotice("Map cleared."); }}><Eraser size={15} /> Clear</Button>
              <Button onClick={() => setNotice("Strategy saved.")}><Save size={15} /> Save strategy</Button>
            </div>
          </div>

          <div
            ref={boardRef}
            className={`strategy-board relative aspect-[4/3] overflow-hidden rounded-lg border ${canEdit ? "border-gold/35" : "border-blue-200/15"} bg-background shadow-2xl`}
            onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
            onDrop={(event) => { event.preventDefault(); addHero(event.dataTransfer.getData("text/hero-id"), event.clientX, event.clientY); }}
            onClick={(event) => { if (selectedHeroId) addHero(selectedHeroId, event.clientX, event.clientY); }}
          >
            <img src={`${import.meta.env.BASE_URL}strategy/tactical-map.svg`} alt="Three-lane tactical battlefield" className="absolute inset-0 h-full w-full select-none object-cover" draggable={false} />
            <div className="pointer-events-none absolute inset-0 bg-black/10" />
            {placements.map((placement) => (
              <button
                key={placement.id}
                type="button"
                aria-label={`${placement.heroName} at ${Math.round(placement.xPercent)}, ${Math.round(placement.yPercent)}`}
                className={`hero-token absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full transition-[box-shadow,transform] sm:h-14 sm:w-14 ${selectedPlacementId === placement.id ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : ""}`}
                style={{ left: `${placement.xPercent}%`, top: `${placement.yPercent}%` }}
                onClick={(event) => { event.stopPropagation(); setSelectedPlacementId(placement.id); }}
                onPointerDown={(event) => { if (!canEdit) return; event.currentTarget.setPointerCapture(event.pointerId); draggingPlacementRef.current = placement.id; setSelectedPlacementId(placement.id); }}
                onPointerMove={(event) => {
                  if (!canEdit || draggingPlacementRef.current !== placement.id) return;
                  const next = coordinatesFromEvent(event.clientX, event.clientY);
                  if (next) persist(moveStrategyPlacement(placements, placement.id, next.xPercent, next.yPercent, username));
                }}
                onPointerUp={() => { draggingPlacementRef.current = null; setNotice(`${placement.heroName} position updated.`); }}
              >
                <HeroIcon heroName={placement.heroName} className="h-full w-full rounded-full object-cover" />
                <span className="pointer-events-none absolute top-full mt-1 max-w-24 truncate rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white">{placement.heroName}</span>
              </button>
            ))}
            {placements.length === 0 ? <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="rounded-lg border border-white/10 bg-black/65 px-5 py-4 text-center backdrop-blur"><Map className="mx-auto mb-2 text-gold" /><p className="font-black uppercase text-white">Build your formation</p><p className="mt-1 text-xs text-text-muted">Drag a hero here, or select one and tap the map.</p></div></div> : null}
          </div>
          <p className="min-h-5 text-xs font-semibold text-text-muted" role="status">{selectedHeroId ? "Hero selected. Tap a position on the map." : notice}</p>
        </div>

        <aside className="hero-tray flex max-h-[calc(75vw+64px)] min-h-96 flex-col rounded-lg border border-blue-200/15 bg-surface p-3 xl:max-h-[720px]">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Deployment tray</p><h2 className="font-display text-xl font-black text-gold">Heroes</h2></div>{!canEdit ? <Eye className="text-text-muted" /> : null}</div>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input aria-label="Search heroes" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search heroes" /></div>
          <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 xl:grid-cols-3">
            {filteredHeroes.map((hero) => {
              const isUsed = placements.some((placement) => placement.heroId === hero.assetName);
              return <button key={hero.assetName} type="button" draggable={canEdit && !isUsed} disabled={!canEdit || isUsed} onDragStart={(event) => event.dataTransfer.setData("text/hero-id", hero.assetName)} onClick={() => setSelectedHeroId(hero.assetName)} className={`relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border p-2 transition ${selectedHeroId === hero.assetName ? "border-gold bg-gold/10" : "border-blue-200/10 bg-background/60 hover:border-gold/30"} disabled:cursor-not-allowed disabled:opacity-35`}>
                <HeroIcon heroName={hero.name} className="h-10 w-10 rounded-full object-cover" /><span className="w-full truncate text-[9px] font-bold text-white">{hero.name}</span>{isUsed ? <Check className="absolute right-1 top-1 h-3 w-3 text-gold" /> : null}
              </button>;
            })}
          </div>
          {isAdmin ? <Button variant="secondary" className="mt-3 w-full" onClick={() => setShowEditors(true)}><Settings2 size={15} /> Manage strategy editors</Button> : null}
        </aside>
      </div>

      {showEditors ? <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowEditors(false); }}><div className="w-full max-w-lg rounded-lg border border-gold/25 bg-surface shadow-2xl"><div className="flex items-center justify-between border-b border-blue-200/10 p-5"><div><p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin control</p><h2 className="font-display text-2xl font-black text-gold">Strategy Editors</h2></div><button type="button" onClick={() => setShowEditors(false)} aria-label="Close editor permissions" className="rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white"><X /></button></div><div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">{members.filter((member) => member.status === "Active").map((member) => { const enabled = strategyEditorUsernames.includes(member.username.toLowerCase()); return <label key={member.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-blue-200/10 bg-background/55 p-3"><span><strong className="block text-sm text-white">{member.playerName}</strong><span className="text-xs text-text-muted">@{member.username}</span></span><input type="checkbox" checked={enabled} onChange={() => setStrategyEditorUsernames(toggleStrategyEditor(strategyEditorUsernames, member.username))} className="h-5 w-5 accent-[#f2c453]" /></label>; })}</div></div></div> : null}
    </section>
  );
}
