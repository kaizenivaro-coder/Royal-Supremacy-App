import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  Check,
  Eye,
  LockKeyhole,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings2,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { HeroIcon } from "../components/HeroIcon";
import { StrategyHeroMenu } from "../components/StrategyHeroMenu";
import { StrategyMovementOverlay } from "../components/StrategyMovementOverlay";
import { Button, Input } from "../components/ui";
import { useAppStore } from "../data/store";
import {
  canEditPublicStrategy,
  createStrategyMovementRoute,
  duplicateStrategyPlacement,
  getRenderableStrategyRoutes,
  getStrategyRoutePoints,
  moveStrategyPlacement,
  placeStrategyHero,
  removeStrategyPlacement,
  toggleStrategyEditor,
  updateStrategyPlacement,
} from "../lib/strategy";
import { getMovementDurationMs } from "../lib/strategyPointer";
import { MAIN_HERO_OPTIONS } from "./Profile";
import type {
  StrategyMovementRoute,
  StrategyPlacement,
  StrategyRoutePoint,
} from "../types";

type Room = "private" | "public";
type TeamColor = NonNullable<StrategyPlacement["teamColor"]>;
type MapPoint = StrategyRoutePoint;
type ContextMenuState = { placementId: string; x: number; y: number };
type MovementDraft = {
  placementId: string;
  points: StrategyRoutePoint[];
  cursorPoint: StrategyRoutePoint;
  inputMode: "desktop" | "mobile";
};
type PointerSession = {
  placementId: string;
  pointerId: number;
  pointerType: string;
  startClientX: number;
  startClientY: number;
  intent: "pending" | "drag" | "movement";
  latestPoint: MapPoint | null;
  holdTimer: number | null;
  cleanup: () => void;
};

const getTeamColor = (placement?: StrategyPlacement): TeamColor =>
  placement?.teamColor ?? "unassigned";

function pointsMatch(a: StrategyRoutePoint, b: StrategyRoutePoint) {
  return Math.hypot(a.xPercent - b.xPercent, a.yPercent - b.yPercent) < 0.5;
}

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
  const [drawerOpen, setDrawerOpen] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [immersiveFallback, setImmersiveFallback] = useState(false);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<(MapPoint & { placementId: string }) | null>(null);
  const [movementDraft, setMovementDraft] = useState<MovementDraft | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamePlacementId, setRenamePlacementId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearPlacementId, setClearPlacementId] = useState<string | null>(null);
  const [showEditors, setShowEditors] = useState(false);
  const [notice, setNotice] = useState("Changes save automatically.");
  const stageRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);

  const privatePlacements = privateStrategyPlacementsByUser[normalizedUsername] ?? [];
  const placements = room === "private" ? privatePlacements : publicStrategyPlacements;
  const placementsRef = useRef(placements);
  placementsRef.current = placements;
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
    placementsRef.current = next;
    if (room === "private") setPrivateStrategyPlacements(username, next);
    else setPublicStrategyPlacements(next);
  };
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const coordinatesFromClient = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      xPercent: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      yPercent: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const removeHero = (placementId: string) => {
    persist(removeStrategyPlacement(placementsRef.current, placementId));
    setMovementDraft((draft) => draft?.placementId === placementId ? null : draft);
    setSelectedPlacementId((selected) => selected === placementId ? null : selected);
    setContextMenu((menu) => menu?.placementId === placementId ? null : menu);
    setClearPlacementId(null);
    setNotice("Hero and movement route cleared from the map.");
  };

  const addHero = (heroId: string, clientX: number, clientY: number) => {
    if (!canEdit) return;
    const hero = MAIN_HERO_OPTIONS.find((option) => option.assetName === heroId);
    const coordinates = coordinatesFromClient(clientX, clientY);
    if (!hero || !coordinates) return;
    const result = placeStrategyHero(placementsRef.current, {
      heroId,
      heroName: hero.name,
      ...coordinates,
      actorUsername: username,
    });
    persist(result.placements);
    setSelectedPlacementId(result.placements.at(-1)?.id ?? null);
    setNotice(`${hero.name} added to the ${room} board.`);
    setSelectedHeroId(null);
  };

  const startMovement = (
    placementId: string,
    inputMode: MovementDraft["inputMode"] = "desktop",
  ) => {
    const placement = placementsRef.current.find((item) => item.id === placementId);
    if (!placement || !canEdit) return;
    const start = { xPercent: placement.xPercent, yPercent: placement.yPercent };
    setMovementDraft({ placementId, points: [start], cursorPoint: start, inputMode });
    setSelectedHeroId(null);
    setSelectedPlacementId(placementId);
    setContextMenu(null);
    setNotice(inputMode === "mobile"
      ? "Tap waypoints, then choose Done."
      : "Right-click waypoints. Left-click the final endpoint.");
  };

  const addMovementWaypoint = () => {
    setMovementDraft((draft) => {
      if (!draft) return null;
      const last = draft.points.at(-1)!;
      return pointsMatch(last, draft.cursorPoint)
        ? draft
        : { ...draft, points: [...draft.points, draft.cursorPoint] };
    });
  };

  const playMovement = (placementId: string, route: StrategyMovementRoute) => {
    const token = document.querySelector<HTMLElement>(`[data-strategy-placement-id="${placementId}"]`);
    const rect = boardRef.current?.getBoundingClientRect();
    if (!token || !rect) return;
    const points = getStrategyRoutePoints(route);
    const segmentLengths = points.slice(1).map((point, index) => {
      const previous = points[index]!;
      return Math.hypot(
        ((point.xPercent - previous.xPercent) / 100) * rect.width,
        ((point.yPercent - previous.yPercent) / 100) * rect.height,
      );
    });
    const totalDistance = segmentLengths.reduce((sum, length) => sum + length, 0);
    let distanceTravelled = 0;
    const keyframes = points.map((point, index) => {
      if (index > 0) distanceTravelled += segmentLengths[index - 1] ?? 0;
      return {
        left: `${point.xPercent}%`,
        top: `${point.yPercent}%`,
        offset: totalDistance > 0 ? distanceTravelled / totalDistance : index / Math.max(1, points.length - 1),
      };
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    token.animate(keyframes, {
      duration: getMovementDurationMs(totalDistance),
      easing: "linear",
    });
  };

  const confirmMovement = (includeCursor: boolean) => {
    if (!movementDraft) return;
    const lastPoint = movementDraft.points.at(-1)!;
    const points = includeCursor && !pointsMatch(lastPoint, movementDraft.cursorPoint)
      ? [...movementDraft.points, movementDraft.cursorPoint]
      : movementDraft.points;
    if (points.length < 2) {
      setNotice("Add at least one endpoint before finishing the route.");
      return;
    }
    const route = createStrategyMovementRoute(points);
    const withRoute = updateStrategyPlacement(
      placementsRef.current,
      movementDraft.placementId,
      { movementRoute: route },
    );
    const endpoint = points.at(-1)!;
    const moved = moveStrategyPlacement(
      withRoute,
      movementDraft.placementId,
      endpoint.xPercent,
      endpoint.yPercent,
      username,
    );
    persist(moved);
    window.requestAnimationFrame(() => playMovement(movementDraft.placementId, route));
    setMovementDraft(null);
    setNotice(`Movement route saved with ${points.length - 1} segment${points.length === 2 ? "" : "s"}.`);
  };

  const beginPointerSession = (
    event: ReactPointerEvent<HTMLButtonElement>,
    placement: StrategyPlacement,
  ) => {
    if (
      !canEdit ||
      event.button !== 0 ||
      (event.pointerType === "mouse" && event.buttons !== 1) ||
      movementDraft
    ) return;
    event.preventDefault();
    setContextMenu(null);
    setSelectedPlacementId(placement.id);

    const session: PointerSession = {
      placementId: placement.id,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startClientX: event.clientX,
      startClientY: event.clientY,
      intent: "pending",
      latestPoint: null,
      holdTimer: null,
      cleanup: () => undefined,
    };
    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== session.pointerId) return;
      const distance = Math.hypot(
        moveEvent.clientX - session.startClientX,
        moveEvent.clientY - session.startClientY,
      );
      if (session.intent === "pending" && distance >= 6) {
        session.intent = "drag";
        if (session.holdTimer !== null) window.clearTimeout(session.holdTimer);
      }
      const point = coordinatesFromClient(moveEvent.clientX, moveEvent.clientY);
      if (!point) return;
      session.latestPoint = point;
      if (session.intent === "drag") {
        setDragPosition({ placementId: placement.id, ...point });
      } else if (session.intent === "movement") {
        setMovementDraft((draft) => draft?.placementId === placement.id
          ? { ...draft, cursorPoint: point }
          : draft);
      }
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== session.pointerId) return;
      session.cleanup();
      if (session.holdTimer !== null) window.clearTimeout(session.holdTimer);
      if (session.intent === "drag" && session.latestPoint) {
        persistRef.current(moveStrategyPlacement(
          placementsRef.current,
          placement.id,
          session.latestPoint.xPercent,
          session.latestPoint.yPercent,
          username,
        ));
        setNotice(`${placement.label || placement.heroName} position updated.`);
      }
      setDragPosition(null);
      pointerSessionRef.current = null;
    };
    session.cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    session.holdTimer = window.setTimeout(() => {
      if (session.intent !== "pending") return;
      session.intent = "movement";
      startMovement(placement.id, event.pointerType === "touch" ? "mobile" : "desktop");
    }, 500);
    pointerSessionRef.current = session;
  };

  const cancelPointerSession = () => {
    const session = pointerSessionRef.current;
    if (!session) return;
    if (session.holdTimer !== null) window.clearTimeout(session.holdTimer);
    session.cleanup();
    pointerSessionRef.current = null;
    setDragPosition(null);
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (immersiveFallback) {
      setImmersiveFallback(false);
      return;
    }
    try {
      await stageRef.current?.requestFullscreen();
    } catch {
      setImmersiveFallback(true);
    }
  };

  useEffect(() => () => pointerSessionRef.current?.cleanup(), []);
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);
  useEffect(() => {
    document.body.style.overflow = immersiveFallback || isFullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [immersiveFallback, isFullscreen]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMovementDraft(null);
      setContextMenu(null);
      setRenamePlacementId(null);
      setClearPlacementId(null);
      if (immersiveFallback) setImmersiveFallback(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [immersiveFallback]);

  const selectedPlacement = placements.find((item) => item.id === contextMenu?.placementId);
  const savedRoutes = getRenderableStrategyRoutes(placements);
  const draftOwner = movementDraft
    ? placements.find((item) => item.id === movementDraft.placementId)
    : undefined;
  const previewRoute = movementDraft && draftOwner
    ? {
        id: `preview-${movementDraft.placementId}`,
        teamColor: getTeamColor(draftOwner),
        route: createStrategyMovementRoute([
          ...movementDraft.points,
          ...(pointsMatch(movementDraft.points.at(-1)!, movementDraft.cursorPoint)
            ? []
            : [movementDraft.cursorPoint]),
        ]),
      }
    : null;
  const fullscreenActive = isFullscreen || immersiveFallback;

  return (
    <section className="strategy-room space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-muted">Tactical command</p>
          <h1 className="font-display text-3xl font-black uppercase text-gold sm:text-4xl mlbb-title">Strategy Room</h1>
        </div>
        <p className="hidden text-xs font-semibold text-text-muted sm:block">Right-click heroes for tactical controls</p>
      </div>

      <div
        ref={stageRef}
        className={`strategy-stage isolate overflow-hidden bg-black shadow-2xl ${fullscreenActive ? "fixed inset-0 z-[80] h-screen min-h-0 w-screen rounded-none border-0" : "relative h-[min(76vh,780px)] min-h-[560px] rounded-lg border border-gold/25"}`}
      >
        <div
          ref={boardRef}
          className="strategy-board absolute inset-0 overflow-hidden bg-background"
          onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
          onDrop={(event) => { event.preventDefault(); addHero(event.dataTransfer.getData("text/hero-id"), event.clientX, event.clientY); }}
          onPointerMove={(event) => {
            if (!movementDraft) return;
            const point = coordinatesFromClient(event.clientX, event.clientY);
            if (point) setMovementDraft({ ...movementDraft, cursorPoint: point });
          }}
          onClick={(event) => {
            if (movementDraft) {
              if (movementDraft.inputMode === "mobile") addMovementWaypoint();
              else confirmMovement(true);
            } else if (selectedHeroId) {
              addHero(selectedHeroId, event.clientX, event.clientY);
            }
          }}
          onContextMenu={(event) => {
            if (!movementDraft) return;
            event.preventDefault();
            addMovementWaypoint();
            setNotice(`Waypoint ${movementDraft.points.length} added. Left-click to finish.`);
          }}
        >
          <img src={`${import.meta.env.BASE_URL}strategy/mlbb-sanctum-island-map.jpg`} alt="Mobile Legends Sanctum Island battlefield" className="absolute inset-0 h-full w-full select-none object-cover" draggable={false} />
          <div className="pointer-events-none absolute inset-0 bg-black/10" />
          <StrategyMovementOverlay routes={savedRoutes} preview={previewRoute} />
          {placements.map((placement) => {
            const position = dragPosition?.placementId === placement.id ? dragPosition : placement;
            const teamColor = getTeamColor(placement);
            return (
              <button
                key={placement.id}
                type="button"
                data-strategy-placement-id={placement.id}
                aria-label={`${placement.label || placement.heroName} at ${Math.round(position.xPercent)}, ${Math.round(position.yPercent)}`}
                className={`hero-token strategy-token-${teamColor} absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab items-center justify-center rounded-full transition-[box-shadow] lg:h-11 lg:w-11 ${selectedPlacementId === placement.id ? "ring-2 ring-white/85 ring-offset-2 ring-offset-background" : ""} ${movementDraft?.placementId === placement.id ? "strategy-token-moving" : ""}`}
                style={{ left: `${position.xPercent}%`, top: `${position.yPercent}%` }}
                onPointerDown={(event) => beginPointerSession(event, placement)}
                onClick={(event) => {
                  event.stopPropagation();
                  if (movementDraft) {
                    if (movementDraft.inputMode === "mobile") addMovementWaypoint();
                    else confirmMovement(true);
                  } else setSelectedPlacementId(placement.id);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (movementDraft) {
                    addMovementWaypoint();
                    setNotice(`Waypoint ${movementDraft.points.length} added. Left-click to finish.`);
                    return;
                  }
                  cancelPointerSession();
                  setSelectedPlacementId(placement.id);
                  setContextMenu({
                    placementId: placement.id,
                    x: Math.max(8, Math.min(event.clientX, window.innerWidth - 232)),
                    y: Math.max(8, Math.min(event.clientY, window.innerHeight - 360)),
                  });
                }}
              >
                <HeroIcon heroName={placement.heroName} className="pointer-events-none h-full w-full rounded-full object-cover" />
                <span className="pointer-events-none absolute top-full mt-1 max-w-24 truncate rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white">{placement.label || placement.heroName}</span>
              </button>
            );
          })}
        </div>

        <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-[#071425]/62 p-1 shadow-xl backdrop-blur-xl">
          {(["private", "public"] as Room[]).map((item) => <button key={item} type="button" onClick={() => { setRoom(item); setSelectedPlacementId(null); setMovementDraft(null); setContextMenu(null); }} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-black uppercase transition sm:px-4 ${room === item ? "bg-gold/90 text-black shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{item === "private" ? <LockKeyhole size={14} /> : <Users size={14} />}{item}</button>)}
        </div>

        <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreenActive ? "Exit fullscreen" : "Enter fullscreen"} title={fullscreenActive ? "Exit fullscreen" : "Enter fullscreen"} className="absolute left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-black/45 text-white/80 shadow-lg backdrop-blur-lg transition hover:border-gold/45 hover:bg-black/65 hover:text-gold">{fullscreenActive ? <Minimize2 size={19} /> : <Maximize2 size={19} />}</button>

        <div className="absolute bottom-3 left-3 z-30 max-w-[min(70%,520px)] rounded-lg border border-white/10 bg-black/48 px-3 py-2 text-[10px] font-semibold text-white/75 backdrop-blur-lg" role="status">
          <span className="mr-2 text-gold">{placements.length} placed</span>{selectedHeroId ? "Hero selected. Tap the map." : notice}
        </div>

        <button type="button" onClick={() => setDrawerOpen((open) => !open)} aria-label={drawerOpen ? "Collapse hero drawer" : "Expand hero drawer"} title={drawerOpen ? "Collapse hero drawer" : "Expand hero drawer"} className="absolute top-1/2 z-40 grid h-14 w-9 -translate-y-1/2 place-items-center rounded-l-lg border border-r-0 border-white/15 bg-[#071425]/70 text-white/75 shadow-xl backdrop-blur-xl transition-all hover:text-gold" style={{ right: drawerOpen ? "min(330px, 86vw)" : "0" }}>{drawerOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}</button>

        <aside className={`absolute inset-y-0 right-0 z-30 flex w-[min(330px,86vw)] flex-col border-l border-white/15 bg-[#071425]/86 p-3 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Deployment tray</p><h2 className="font-display text-xl font-black text-gold">Heroes</h2></div>{!canEdit ? <Eye className="text-text-muted" /> : null}</div>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input aria-label="Search heroes" value={query} onChange={(event) => setQuery(event.target.value)} className="border-white/10 bg-black/25 pl-9" placeholder="Search heroes" /></div>
          <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {filteredHeroes.map((hero) => <button key={hero.assetName} type="button" draggable={canEdit} disabled={!canEdit} onDragStart={(event) => event.dataTransfer.setData("text/hero-id", hero.assetName)} onClick={() => { setSelectedHeroId(hero.assetName); setDrawerOpen(false); }} className={`relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border p-2 transition ${selectedHeroId === hero.assetName ? "border-gold bg-gold/10" : "border-white/10 bg-black/25 hover:border-gold/35 hover:bg-black/40"} disabled:cursor-not-allowed disabled:opacity-35`}><HeroIcon heroName={hero.name} className="h-10 w-10 rounded-full object-cover" /><span className="w-full truncate text-[9px] font-bold text-white">{hero.name}</span></button>)}
          </div>
          {isAdmin ? <Button variant="secondary" className="mt-3 w-full border-white/10 bg-black/25" onClick={() => setShowEditors(true)}><Settings2 size={15} /> Strategy editors</Button> : null}
        </aside>

        {movementDraft?.inputMode === "mobile" ? <div className="absolute bottom-16 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-lg border border-white/15 bg-black/60 p-2 shadow-xl backdrop-blur-xl"><button type="button" onClick={() => setMovementDraft((draft) => draft && draft.points.length > 1 ? { ...draft, points: draft.points.slice(0, -1) } : draft)} aria-label="Undo waypoint" className="grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10"><Undo2 /></button><button type="button" onClick={() => setMovementDraft(null)} aria-label="Cancel movement" className="grid h-11 w-11 place-items-center rounded-lg text-danger hover:bg-danger/10"><X /></button><button type="button" onClick={() => confirmMovement(false)} aria-label="Finish movement" className="grid h-11 w-11 place-items-center rounded-lg bg-gold text-black"><Check /></button></div> : null}

        {contextMenu && selectedPlacement ? <><div className="fixed inset-0 z-[80]" onMouseDown={() => setContextMenu(null)} /><StrategyHeroMenu x={contextMenu.x} y={contextMenu.y} hasRoute={Boolean(selectedPlacement.movementRoute)} onClose={() => setContextMenu(null)} onMovement={() => startMovement(selectedPlacement.id)} onReplay={() => { if (selectedPlacement.movementRoute) playMovement(selectedPlacement.id, selectedPlacement.movementRoute); }} onRename={() => { setRenamePlacementId(selectedPlacement.id); setRenameValue(selectedPlacement.label || selectedPlacement.heroName); }} onTeamColor={(teamColor) => { persist(updateStrategyPlacement(placementsRef.current, selectedPlacement.id, { teamColor })); setNotice(`${selectedPlacement.heroName} assigned to the ${teamColor} outline.`); }} onDuplicate={() => { const next = duplicateStrategyPlacement(placementsRef.current, selectedPlacement.id, username); persist(next); setSelectedPlacementId(next.at(-1)?.id ?? null); setNotice(`${selectedPlacement.heroName} duplicated.`); }} onClear={() => setClearPlacementId(selectedPlacement.id)} /></> : null}

        {renamePlacementId ? <DialogShell title="Rename Hero" onClose={() => setRenamePlacementId(null)}><label className="text-[10px] font-black uppercase tracking-widest text-text-muted" htmlFor="strategy-label">Tactical label</label><Input id="strategy-label" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={24} /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setRenamePlacementId(null)}>Cancel</Button><Button variant="gold" onClick={() => { persist(updateStrategyPlacement(placementsRef.current, renamePlacementId, { label: renameValue.trim() || undefined })); setRenamePlacementId(null); setNotice("Hero label updated."); }}>Save label</Button></div></DialogShell> : null}

        {clearPlacementId ? <DialogShell title="Clear Hero?" onClose={() => setClearPlacementId(null)}><p className="text-sm leading-6 text-text-muted">This removes this hero and every movement segment owned by it.</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setClearPlacementId(null)}>Cancel</Button><Button variant="danger" onClick={() => removeHero(clearPlacementId)}>Clear Hero</Button></div></DialogShell> : null}

        {showEditors ? <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowEditors(false); }}><div className="w-full max-w-lg rounded-lg border border-gold/25 bg-surface shadow-2xl"><div className="flex items-center justify-between border-b border-blue-200/10 p-5"><div><p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin control</p><h2 className="font-display text-2xl font-black text-gold">Strategy Editors</h2></div><button type="button" onClick={() => setShowEditors(false)} aria-label="Close editor permissions" className="rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white"><X /></button></div><div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">{members.filter((member) => member.status === "Active").map((member) => { const enabled = strategyEditorUsernames.includes(member.username.toLowerCase()); return <label key={member.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-blue-200/10 bg-background/55 p-3"><span><strong className="block text-sm text-white">{member.playerName}</strong><span className="text-xs text-text-muted">@{member.username}</span></span><input type="checkbox" checked={enabled} onChange={() => setStrategyEditorUsernames(toggleStrategyEditor(strategyEditorUsernames, member.username))} className="h-5 w-5 accent-[#f2c453]" /></label>; })}</div></div></div> : null}
      </div>
    </section>
  );
}

function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md space-y-5 rounded-lg border border-gold/25 bg-surface p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-black text-gold">{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`} className="rounded-full p-2 text-text-muted hover:bg-white/5 hover:text-white"><X /></button></div>{children}</div></div>;
}
