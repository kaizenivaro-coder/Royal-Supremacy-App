import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  Check,
  Eye,
  LockKeyhole,
  Maximize2,
  Minimize2,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
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
  canManageStrategyEditors,
  clearStrategyMovementRoute,
  cloneStrategyPlacements,
  createKeyframeTransitionRoute,
  createDefaultStrategyMotionPath,
  createStrategyMovementRoute,
  createStrategyKeyframe,
  duplicateStrategyPlacement,
  findStrategyMotionPath,
  getRenderableStrategyRoutes,
  getStrategyRoutePoints,
  moveStrategyPlacement,
  normalizeStrategySpeed,
  placeStrategyHero,
  removeStrategyPlacement,
  removeStrategyKeyframe,
  removeStrategyMotionPath,
  shouldOpenStrategyDrawerByDefault,
  shouldUseImmersiveStrategyLayout,
  STRATEGY_SPEED_OPTIONS,
  toggleStrategyEditor,
  updateStrategyPlacement,
  upsertStrategyMotionPath,
  upsertStrategyKeyframeSnapshot,
} from "../lib/strategy";
import { getMovementDurationMs } from "../lib/strategyPointer";
import { MAIN_HERO_OPTIONS } from "./Profile";
import type {
  StrategyMovementRoute,
  StrategyKeyframe,
  StrategyMotionPath,
  StrategyPlacement,
  StrategyRoutePoint,
} from "../types";

type Room = "private" | "public";
type TeamColor = NonNullable<StrategyPlacement["teamColor"]>;
type MapPoint = StrategyRoutePoint;
type ContextMenuState = { placementId: string; x: number; y: number };
type MotionPathSelection = {
  fromKeyframeId: string;
  toKeyframeId: string;
  placementId: string;
  pathId: string;
};
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

const getInitialMobileImmersion = () =>
  typeof window !== "undefined" && shouldUseImmersiveStrategyLayout(
    window.innerWidth,
    window.innerHeight,
  );

const getInitialDrawerOpen = () =>
  typeof window !== "undefined" && shouldOpenStrategyDrawerByDefault(
    window.innerWidth,
    window.innerHeight,
  );

const strategyStorageKey = (room: Room, username: string, key: string) =>
  room === "private"
    ? `royal_supremacy_strategy_${key}_private_${username}`
    : `royal_supremacy_strategy_${key}_public`;

function readStrategyStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStrategyStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

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
  const publicKeyframesStorageKey = strategyStorageKey("public", normalizedUsername, "keyframes");
  const privateKeyframesStorageKey = strategyStorageKey("private", normalizedUsername, "keyframes");
  const publicMotionPathsStorageKey = strategyStorageKey("public", normalizedUsername, "motion_paths");
  const privateMotionPathsStorageKey = strategyStorageKey("private", normalizedUsername, "motion_paths");
  const publicSpeedStorageKey = strategyStorageKey("public", normalizedUsername, "speed");
  const privateSpeedStorageKey = strategyStorageKey("private", normalizedUsername, "speed");
  const [room, setRoom] = useState<Room>("private");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(getInitialDrawerOpen);
  const [mobileImmersive, setMobileImmersive] = useState(getInitialMobileImmersion);
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
  const [selectedMotionPath, setSelectedMotionPath] = useState<MotionPathSelection | null>(null);
  const motionWaypointDragRef = useRef<{ pathId: string; pointIndex: number } | null>(null);
  const [publicKeyframes, setPublicKeyframes] = useState<StrategyKeyframe[]>(() =>
    readStrategyStorage<StrategyKeyframe[]>(publicKeyframesStorageKey, []),
  );
  const [privateKeyframes, setPrivateKeyframes] = useState<StrategyKeyframe[]>(() =>
    readStrategyStorage<StrategyKeyframe[]>(privateKeyframesStorageKey, []),
  );
  const [publicMotionPaths, setPublicMotionPaths] = useState<StrategyMotionPath[]>(() =>
    readStrategyStorage<StrategyMotionPath[]>(publicMotionPathsStorageKey, []),
  );
  const [privateMotionPaths, setPrivateMotionPaths] = useState<StrategyMotionPath[]>(() =>
    readStrategyStorage<StrategyMotionPath[]>(privateMotionPathsStorageKey, []),
  );
  const [publicActiveKeyframeId, setPublicActiveKeyframeId] = useState<string | null>(
    () => readStrategyStorage<string | null>(
      strategyStorageKey("public", normalizedUsername, "active_keyframe"),
      null,
    ),
  );
  const [privateActiveKeyframeId, setPrivateActiveKeyframeId] = useState<string | null>(
    () => readStrategyStorage<string | null>(
      strategyStorageKey("private", normalizedUsername, "active_keyframe"),
      null,
    ),
  );
  const [publicMovementSpeed, setPublicMovementSpeed] = useState(() =>
    normalizeStrategySpeed(readStrategyStorage<number>(publicSpeedStorageKey, 1)),
  );
  const [privateMovementSpeed, setPrivateMovementSpeed] = useState(() =>
    normalizeStrategySpeed(readStrategyStorage<number>(privateSpeedStorageKey, 1)),
  );
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
  const canManageEditors = canManageStrategyEditors(isAdmin, room);
  const keyframes = room === "private" ? privateKeyframes : publicKeyframes;
  const activeKeyframeId = room === "private" ? privateActiveKeyframeId : publicActiveKeyframeId;
  const movementSpeed = room === "private" ? privateMovementSpeed : publicMovementSpeed;
  const motionPaths = room === "private" ? privateMotionPaths : publicMotionPaths;
  const activeKeyframeIndex = activeKeyframeId
    ? keyframes.findIndex((keyframe) => keyframe.id === activeKeyframeId)
    : -1;
  const nextKeyframe = activeKeyframeIndex >= 0
    ? keyframes[activeKeyframeIndex + 1]
    : undefined;
  const activeKeyframe = activeKeyframeIndex >= 0
    ? keyframes[activeKeyframeIndex]
    : undefined;

  const setKeyframesForCurrentRoom = (nextKeyframes: StrategyKeyframe[]) => {
    if (room === "private") {
      setPrivateKeyframes(nextKeyframes);
      writeStrategyStorage(privateKeyframesStorageKey, nextKeyframes);
    } else {
      setPublicKeyframes(nextKeyframes);
      writeStrategyStorage(publicKeyframesStorageKey, nextKeyframes);
    }
  };

  const setMotionPathsForCurrentRoom = (nextMotionPaths: StrategyMotionPath[]) => {
    if (room === "private") {
      setPrivateMotionPaths(nextMotionPaths);
      writeStrategyStorage(privateMotionPathsStorageKey, nextMotionPaths);
    } else {
      setPublicMotionPaths(nextMotionPaths);
      writeStrategyStorage(publicMotionPathsStorageKey, nextMotionPaths);
    }
  };

  const setActiveKeyframeForCurrentRoom = (keyframeId: string | null) => {
    if (room === "private") {
      setPrivateActiveKeyframeId(keyframeId);
      writeStrategyStorage(strategyStorageKey("private", normalizedUsername, "active_keyframe"), keyframeId);
    } else {
      setPublicActiveKeyframeId(keyframeId);
      writeStrategyStorage(strategyStorageKey("public", normalizedUsername, "active_keyframe"), keyframeId);
    }
  };

  const setMovementSpeedForCurrentRoom = (speedValue: number) => {
    const nextSpeed = normalizeStrategySpeed(speedValue);
    if (room === "private") {
      setPrivateMovementSpeed(nextSpeed);
      writeStrategyStorage(privateSpeedStorageKey, nextSpeed);
    } else {
      setPublicMovementSpeed(nextSpeed);
      writeStrategyStorage(publicSpeedStorageKey, nextSpeed);
    }
    setNotice(`${room === "private" ? "Private" : "Public"} movement speed set to ${nextSpeed}x.`);
  };

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
    if (activeKeyframeId) {
      setKeyframesForCurrentRoom(
        upsertStrategyKeyframeSnapshot(keyframes, activeKeyframeId, next),
      );
    }
  };
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const loadKeyframeBoard = (keyframe: StrategyKeyframe) => {
    const snapshot = cloneStrategyPlacements(keyframe.placements);
    placementsRef.current = snapshot;
    if (room === "private") setPrivateStrategyPlacements(username, snapshot);
    else setPublicStrategyPlacements(snapshot);
    setSelectedPlacementId(null);
    setMovementDraft(null);
    setContextMenu(null);
  };

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

  const undoMovementWaypoint = () => {
    setMovementDraft((draft) =>
      draft && draft.points.length > 1
        ? { ...draft, points: draft.points.slice(0, -1) }
        : draft,
    );
  };

  const cancelMovementDraft = () => {
    setMovementDraft(null);
    setNotice("Movement draft cancelled.");
  };

  const playMovement = (
    placementId: string,
    route: StrategyMovementRoute,
    speedMultiplier = movementSpeed,
  ) => {
    const token = document.querySelector<HTMLElement>(`[data-strategy-placement-id="${placementId}"]`);
    const rect = boardRef.current?.getBoundingClientRect();
    if (!token || !rect) return 0;
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
    const duration = getMovementDurationMs(totalDistance, 160 * speedMultiplier);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return duration;
    token.animate(keyframes, {
      duration,
      easing: "linear",
      fill: "forwards",
    });
    return duration;
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

  const getSyncedKeyframes = () =>
    activeKeyframeId
      ? upsertStrategyKeyframeSnapshot(keyframes, activeKeyframeId, placementsRef.current)
      : keyframes;

  const selectKeyframe = (keyframeId: string) => {
    if (keyframeId === activeKeyframeId) return;
    setKeyframesForCurrentRoom(getSyncedKeyframes());
    setSelectedMotionPath(null);
    setActiveKeyframeForCurrentRoom(keyframeId);
    setNotice("Keyframe loaded.");
  };

  const addKeyframe = () => {
    if (!canEdit) return;
    const syncedKeyframes = getSyncedKeyframes();
    const nextKeyframe = createStrategyKeyframe(placementsRef.current, syncedKeyframes.length);
    setKeyframesForCurrentRoom([...syncedKeyframes, nextKeyframe]);
    setActiveKeyframeForCurrentRoom(nextKeyframe.id);
    setNotice(`${nextKeyframe.label} added from the current map.`);
  };

  const removeActiveKeyframe = () => {
    if (!canEdit || !activeKeyframeId) return;
    const result = removeStrategyKeyframe(keyframes, activeKeyframeId);
    setKeyframesForCurrentRoom(result.keyframes);
    setActiveKeyframeForCurrentRoom(result.activeKeyframeId);
    setNotice(result.keyframes.length === keyframes.length
      ? "At least one keyframe must stay on the map."
      : "Keyframe removed.");
  };

  const clearMovementLine = (placementId: string) => {
    persist(clearStrategyMovementRoute(placementsRef.current, placementId));
    setNotice("Movement line cleared. Hero remains on the map.");
  };

  const getMotionTransition = (placementId: string) => {
    if (!activeKeyframeId || !nextKeyframe) return null;
    const from = placementsRef.current.find((placement) => placement.id === placementId)
      ?? activeKeyframe?.placements.find((placement) => placement.id === placementId);
    const to = nextKeyframe.placements.find((placement) => placement.id === placementId);
    if (!from || !to) return null;
    return {
      fromKeyframeId: activeKeyframeId,
      toKeyframeId: nextKeyframe.id,
      from,
      to,
    };
  };

  const getMotionPath = (placementId: string) => {
    const transition = getMotionTransition(placementId);
    if (!transition) return undefined;
    return findStrategyMotionPath(motionPaths, {
      fromKeyframeId: transition.fromKeyframeId,
      toKeyframeId: transition.toKeyframeId,
      placementId,
    });
  };

  const selectMotionPath = (path: StrategyMotionPath) => {
    setSelectedMotionPath({
      fromKeyframeId: path.fromKeyframeId,
      toKeyframeId: path.toKeyframeId,
      placementId: path.placementId,
      pathId: path.id,
    });
  };

  const editMotionPath = (placementId: string) => {
    if (!canEdit) return;
    const transition = getMotionTransition(placementId);
    if (!transition) {
      setNotice("Add a next keyframe with this hero before editing motion.");
      return;
    }

    const existingPath = findStrategyMotionPath(motionPaths, {
      fromKeyframeId: transition.fromKeyframeId,
      toKeyframeId: transition.toKeyframeId,
      placementId,
    });
    const path = existingPath ?? createDefaultStrategyMotionPath({
      fromKeyframeId: transition.fromKeyframeId,
      toKeyframeId: transition.toKeyframeId,
      placementId,
      from: transition.from,
      to: transition.to,
    });

    setMotionPathsForCurrentRoom(upsertStrategyMotionPath(motionPaths, path));
    selectMotionPath(path);
    setNotice("Motion path editing: tap the line/map to add waypoints, drag middle dots to reshape.");
  };

  const clearMotionPath = (placementId: string) => {
    const transition = getMotionTransition(placementId);
    if (!transition) return;
    setMotionPathsForCurrentRoom(removeStrategyMotionPath(motionPaths, {
      fromKeyframeId: transition.fromKeyframeId,
      toKeyframeId: transition.toKeyframeId,
      placementId,
    }));
    setSelectedMotionPath((selected) => selected?.placementId === placementId ? null : selected);
    setNotice("Motion path cleared. Keyframe positions remain unchanged.");
  };

  const updateMotionPathPoints = (pathId: string, points: StrategyRoutePoint[]) => {
    const path = motionPaths.find((item) => item.id === pathId);
    if (!path || points.length < 2) return;
    setMotionPathsForCurrentRoom(upsertStrategyMotionPath(motionPaths, {
      ...path,
      points,
    }));
  };

  const insertMotionWaypoint = (pathId: string, point: StrategyRoutePoint) => {
    const path = motionPaths.find((item) => item.id === pathId);
    if (!path || path.points.length < 2) return;
    updateMotionPathPoints(pathId, [
      ...path.points.slice(0, -1),
      point,
      path.points.at(-1)!,
    ]);
  };

  const startMotionWaypointDrag = (
    event: ReactPointerEvent<SVGCircleElement>,
    pathId: string,
    pointIndex: number,
  ) => {
    const path = motionPaths.find((item) => item.id === pathId);
    if (!path || pointIndex === 0 || pointIndex === path.points.length - 1) return;
    event.preventDefault();
    event.stopPropagation();
    motionWaypointDragRef.current = { pathId, pointIndex };
  };

  const playKeyframeSequence = async () => {
    if (keyframes.length < 2) {
      setNotice("Add at least two keyframes before playback.");
      return;
    }
    const syncedKeyframes = getSyncedKeyframes();
    setMovementDraft(null);
    setKeyframesForCurrentRoom(syncedKeyframes);
    setNotice(`Playing ${syncedKeyframes.length} keyframes at ${movementSpeed}x.`);

    for (let index = 0; index < syncedKeyframes.length - 1; index += 1) {
      const from = syncedKeyframes[index]!;
      const to = syncedKeyframes[index + 1]!;
      if (index === 0) {
        loadKeyframeBoard(from);
        await new Promise((resolve) => window.setTimeout(resolve, 90));
      }

      let maxDuration = 0;
      to.placements.forEach((targetPlacement) => {
        const sourcePlacement = from.placements.find((placement) => placement.id === targetPlacement.id);
        if (!sourcePlacement) return;
        const motionPath = findStrategyMotionPath(motionPaths, {
          fromKeyframeId: from.id,
          toKeyframeId: to.id,
          placementId: targetPlacement.id,
        });
        const route = createKeyframeTransitionRoute(sourcePlacement, targetPlacement, motionPath);
        maxDuration = Math.max(
          maxDuration,
          playMovement(targetPlacement.id, route, movementSpeed),
        );
      });

      await new Promise((resolve) => window.setTimeout(resolve, maxDuration + 100));
      loadKeyframeBoard(to);
    }

    setActiveKeyframeForCurrentRoom(syncedKeyframes.at(-1)!.id);

    setNotice("Keyframe playback complete.");
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
    setPrivateKeyframes(readStrategyStorage<StrategyKeyframe[]>(privateKeyframesStorageKey, []));
    setPrivateMotionPaths(readStrategyStorage<StrategyMotionPath[]>(privateMotionPathsStorageKey, []));
    setPrivateActiveKeyframeId(readStrategyStorage<string | null>(
      strategyStorageKey("private", normalizedUsername, "active_keyframe"),
      null,
    ));
    setPrivateMovementSpeed(normalizeStrategySpeed(
      readStrategyStorage<number>(privateSpeedStorageKey, 1),
    ));
  }, [normalizedUsername, privateKeyframesStorageKey, privateMotionPathsStorageKey, privateSpeedStorageKey]);
  useEffect(() => {
    if (keyframes.length === 0) {
      const firstKeyframe = createStrategyKeyframe(placementsRef.current, 0);
      setKeyframesForCurrentRoom([firstKeyframe]);
      setActiveKeyframeForCurrentRoom(firstKeyframe.id);
      return;
    }

    if (!activeKeyframeId || !keyframes.some((keyframe) => keyframe.id === activeKeyframeId)) {
      setActiveKeyframeForCurrentRoom(keyframes[0]!.id);
    }
  }, [activeKeyframeId, keyframes.length, room, normalizedUsername]);
  useEffect(() => {
    if (!activeKeyframeId) return;
    const activeKeyframe = keyframes.find((keyframe) => keyframe.id === activeKeyframeId);
    if (activeKeyframe) loadKeyframeBoard(activeKeyframe);
  }, [activeKeyframeId, room]);
  useEffect(() => {
    const updateMobileImmersion = () => {
      setMobileImmersive(shouldUseImmersiveStrategyLayout(
        window.innerWidth,
        window.innerHeight,
      ));
    };
    updateMobileImmersion();
    window.addEventListener("resize", updateMobileImmersion);
    window.addEventListener("orientationchange", updateMobileImmersion);
    return () => {
      window.removeEventListener("resize", updateMobileImmersion);
      window.removeEventListener("orientationchange", updateMobileImmersion);
    };
  }, []);
  useEffect(() => {
    if (room === "private") setShowEditors(false);
  }, [room]);
  useEffect(() => {
    if (mobileImmersive) setDrawerOpen(false);
  }, [mobileImmersive]);
  useEffect(() => {
    document.body.style.overflow = immersiveFallback || isFullscreen || mobileImmersive ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [immersiveFallback, isFullscreen, mobileImmersive]);
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
  const selectedPlacementMotionPath = selectedPlacement ? getMotionPath(selectedPlacement.id) : undefined;
  const canEditSelectedMotionPath = Boolean(selectedPlacement && getMotionTransition(selectedPlacement.id));
  const savedRoutes = getRenderableStrategyRoutes(placements);
  const activeMotionPaths = activeKeyframeId && nextKeyframe
    ? motionPaths.filter((path) =>
        path.fromKeyframeId === activeKeyframeId &&
        path.toKeyframeId === nextKeyframe.id,
      )
    : [];
  const selectedMotionPathData = selectedMotionPath
    ? motionPaths.find((path) => path.id === selectedMotionPath.pathId)
    : undefined;
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
  const fullscreenControlActive = isFullscreen || immersiveFallback;
  const mapImmersive = fullscreenControlActive || mobileImmersive;

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
        className={`strategy-stage isolate overflow-hidden bg-black shadow-2xl ${mapImmersive ? "fixed inset-0 z-[80] h-[100dvh] min-h-0 w-screen rounded-none border-0" : "relative h-[min(76vh,780px)] min-h-[560px] rounded-lg border border-gold/25"}`}
      >
        <div
          ref={boardRef}
          className="strategy-board absolute inset-0 overflow-hidden bg-background"
          onDragOver={(event) => { if (canEdit) event.preventDefault(); }}
          onDrop={(event) => { event.preventDefault(); addHero(event.dataTransfer.getData("text/hero-id"), event.clientX, event.clientY); }}
          onPointerMove={(event) => {
            const motionDrag = motionWaypointDragRef.current;
            if (motionDrag) {
              const point = coordinatesFromClient(event.clientX, event.clientY);
              const path = motionPaths.find((item) => item.id === motionDrag.pathId);
              if (point && path) {
                updateMotionPathPoints(path.id, path.points.map((routePoint, index) =>
                  index === motionDrag.pointIndex ? point : routePoint,
                ));
              }
              return;
            }
            if (!movementDraft) return;
            const point = coordinatesFromClient(event.clientX, event.clientY);
            if (point) setMovementDraft({ ...movementDraft, cursorPoint: point });
          }}
          onPointerUp={() => {
            motionWaypointDragRef.current = null;
          }}
          onPointerCancel={() => {
            motionWaypointDragRef.current = null;
          }}
          onClick={(event) => {
            if (movementDraft) {
              if (movementDraft.inputMode === "mobile") addMovementWaypoint();
              else confirmMovement(true);
            } else if (selectedMotionPath) {
              const point = coordinatesFromClient(event.clientX, event.clientY);
              if (point) insertMotionWaypoint(selectedMotionPath.pathId, point);
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
          {activeMotionPaths.length > 0 ? (
            <svg className="absolute inset-0 z-[7] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Keyframe motion paths">
              {activeMotionPaths.map((path) => {
                const selected = selectedMotionPath?.pathId === path.id;
                return (
                  <polyline
                    key={path.id}
                    points={path.points.map((point) => `${point.xPercent},${point.yPercent}`).join(" ")}
                    vectorEffect="non-scaling-stroke"
                    className={`strategy-motion-path ${selected ? "strategy-motion-path-selected" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectMotionPath(path);
                      const point = coordinatesFromClient(event.clientX, event.clientY);
                      if (point && selected) insertMotionWaypoint(path.id, point);
                      setNotice("Motion path selected. Click line/map to add waypoints; drag middle dots.");
                    }}
                  />
                );
              })}
              {selectedMotionPathData?.points.map((point, index, points) => {
                const endpoint = index === 0 || index === points.length - 1;
                return (
                  <circle
                    key={`${selectedMotionPathData.id}-${index}`}
                    cx={point.xPercent}
                    cy={point.yPercent}
                    r={endpoint ? 1.25 : 1.75}
                    vectorEffect="non-scaling-stroke"
                    className={`strategy-motion-waypoint ${endpoint ? "strategy-motion-waypoint-locked" : ""}`}
                    onPointerDown={(event) => startMotionWaypointDrag(event, selectedMotionPathData.id, index)}
                    onClick={(event) => event.stopPropagation()}
                  />
                );
              })}
            </svg>
          ) : null}
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
          {(["private", "public"] as Room[]).map((item) => <button key={item} type="button" onClick={() => { setRoom(item); setSelectedPlacementId(null); setSelectedMotionPath(null); setMovementDraft(null); setContextMenu(null); }} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-black uppercase transition sm:px-4 ${room === item ? "bg-gold/90 text-black shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{item === "private" ? <LockKeyhole size={14} /> : <Users size={14} />}{item}</button>)}
        </div>

        <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreenControlActive ? "Exit fullscreen" : "Enter fullscreen"} title={fullscreenControlActive ? "Exit fullscreen" : "Enter fullscreen"} className="absolute left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-black/45 text-white/80 shadow-lg backdrop-blur-lg transition hover:border-gold/45 hover:bg-black/65 hover:text-gold">{fullscreenControlActive ? <Minimize2 size={19} /> : <Maximize2 size={19} />}</button>

        <div className="strategy-landscape-hint pointer-events-none absolute left-1/2 top-16 z-30 w-[min(82vw,360px)] -translate-x-1/2 rounded-lg border border-gold/25 bg-black/62 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/80 shadow-xl backdrop-blur-xl md:hidden">
          Rotate phone sideways for full strategy view
        </div>

        <div className="absolute bottom-3 left-3 z-30 max-w-[min(70%,520px)] rounded-lg border border-white/10 bg-black/48 px-3 py-2 text-[10px] font-semibold text-white/75 backdrop-blur-lg" role="status">
          <span className="mr-2 text-gold">{placements.length} placed</span>{selectedHeroId ? "Hero selected. Tap the map." : notice}
        </div>

        <div className="absolute bottom-3 left-1/2 z-40 flex max-w-[min(58vw,520px)] -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-black/48 px-2 py-1.5 shadow-xl backdrop-blur-xl">
          <button type="button" onClick={removeActiveKeyframe} disabled={!canEdit || keyframes.length <= 1} aria-label="Remove selected keyframe" className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"><Minus size={16} /></button>
          <div className="flex max-w-[260px] items-center gap-1 overflow-x-auto px-1">
            {keyframes.map((keyframe, index) => {
              const active = keyframe.id === activeKeyframeId;
              return (
                <button
                  key={keyframe.id}
                  type="button"
                  onClick={() => selectKeyframe(keyframe.id)}
                  aria-label={`Select ${keyframe.label}`}
                  title={keyframe.label}
                  className={`h-4 w-4 shrink-0 rounded-full border transition ${active ? "border-[#65c8ff] bg-[#65c8ff] shadow-[0_0_14px_rgba(101,200,255,0.95)]" : "border-[#65c8ff]/70 bg-transparent hover:bg-[#65c8ff]/25"}`}
                >
                  <span className="sr-only">{index + 1}</span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={addKeyframe} disabled={!canEdit} aria-label="Add keyframe" className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"><Plus size={16} /></button>
          <button type="button" onClick={() => void playKeyframeSequence()} disabled={keyframes.length < 2} aria-label="Play keyframes" className="grid h-8 w-8 place-items-center rounded-full border border-gold/35 bg-gold/15 text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"><Play size={15} /></button>
        </div>

        <button type="button" onClick={() => setDrawerOpen((open) => !open)} aria-label={drawerOpen ? "Collapse hero drawer" : "Expand hero drawer"} title={drawerOpen ? "Collapse hero drawer" : "Expand hero drawer"} className="absolute top-1/2 z-40 grid h-14 w-9 -translate-y-1/2 place-items-center rounded-l-lg border border-r-0 border-white/15 bg-[#071425]/70 text-white/75 shadow-xl backdrop-blur-xl transition-all hover:text-gold" style={{ right: drawerOpen ? "min(330px, 86vw)" : "0" }}>{drawerOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}</button>

        <aside className={`absolute inset-y-0 right-0 z-30 flex w-[min(330px,86vw)] flex-col border-l border-white/15 bg-[#071425]/86 p-3 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Deployment tray</p><h2 className="font-display text-xl font-black text-gold">Heroes</h2></div>{!canEdit ? <Eye className="text-text-muted" /> : null}</div>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input aria-label="Search heroes" value={query} onChange={(event) => setQuery(event.target.value)} className="border-white/10 bg-black/25 pl-9" placeholder="Search heroes" /></div>
          <div className="mb-3 rounded-lg border border-white/10 bg-black/25 p-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Movement speed</p>
              <span className="text-[10px] font-black text-gold">{movementSpeed}x</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {STRATEGY_SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setMovementSpeedForCurrentRoom(speed)}
                  className={`rounded-md border px-1.5 py-2 text-[10px] font-black transition ${movementSpeed === speed ? "border-gold bg-gold text-black" : "border-white/10 bg-white/5 text-white/70 hover:border-gold/45 hover:text-gold"}`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {filteredHeroes.map((hero) => <button key={hero.assetName} type="button" draggable={canEdit} disabled={!canEdit} onDragStart={(event) => event.dataTransfer.setData("text/hero-id", hero.assetName)} onClick={() => { setSelectedHeroId(hero.assetName); setDrawerOpen(false); }} className={`relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border p-2 transition ${selectedHeroId === hero.assetName ? "border-gold bg-gold/10" : "border-white/10 bg-black/25 hover:border-gold/35 hover:bg-black/40"} disabled:cursor-not-allowed disabled:opacity-35`}><HeroIcon heroName={hero.name} className="h-10 w-10 rounded-full object-cover" /><span className="w-full truncate text-[9px] font-bold text-white">{hero.name}</span></button>)}
          </div>
          {canManageEditors ? <Button variant="secondary" className="mt-3 w-full border-white/10 bg-black/25" onClick={() => setShowEditors(true)}><Settings2 size={15} /> Strategy editors</Button> : null}
        </aside>

        {movementDraft ? (
          <StrategyMovementDraftControls
            inputMode={movementDraft.inputMode}
            waypointCount={Math.max(0, movementDraft.points.length - 1)}
            onUndo={undoMovementWaypoint}
            onCancel={cancelMovementDraft}
            onFinish={() => confirmMovement(movementDraft.inputMode === "desktop")}
          />
        ) : null}

        {contextMenu && selectedPlacement ? <><div className="fixed inset-0 z-[80]" onMouseDown={() => setContextMenu(null)} /><StrategyHeroMenu x={contextMenu.x} y={contextMenu.y} hasRoute={Boolean(selectedPlacement.movementRoute)} hasMotionPath={Boolean(selectedPlacementMotionPath)} canEditMotionPath={canEditSelectedMotionPath} onClose={() => setContextMenu(null)} onMovement={() => startMovement(selectedPlacement.id)} onEditMotionPath={() => editMotionPath(selectedPlacement.id)} onReplay={() => { if (selectedPlacement.movementRoute) playMovement(selectedPlacement.id, selectedPlacement.movementRoute); }} onRename={() => { setRenamePlacementId(selectedPlacement.id); setRenameValue(selectedPlacement.label || selectedPlacement.heroName); }} onTeamColor={(teamColor) => { persist(updateStrategyPlacement(placementsRef.current, selectedPlacement.id, { teamColor })); setNotice(`${selectedPlacement.heroName} assigned to the ${teamColor} outline.`); }} onDuplicate={() => { const next = duplicateStrategyPlacement(placementsRef.current, selectedPlacement.id, username); persist(next); setSelectedPlacementId(next.at(-1)?.id ?? null); setNotice(`${selectedPlacement.heroName} duplicated.`); }} onClearMovement={() => clearMovementLine(selectedPlacement.id)} onClearMotionPath={() => clearMotionPath(selectedPlacement.id)} onClear={() => setClearPlacementId(selectedPlacement.id)} /></> : null}

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

export function StrategyMovementDraftControls({
  inputMode,
  waypointCount,
  onUndo,
  onCancel,
  onFinish,
}: {
  inputMode: MovementDraft["inputMode"];
  waypointCount: number;
  onUndo: () => void;
  onCancel: () => void;
  onFinish: () => void;
}) {
  const compact = inputMode === "mobile";
  return (
    <div className="absolute bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/15 bg-black/62 p-2 shadow-xl backdrop-blur-xl">
      {!compact ? (
        <div className="hidden min-w-32 px-2 text-left sm:block">
          <p className="text-[9px] font-black uppercase tracking-widest text-gold">{waypointCount} waypoint{waypointCount === 1 ? "" : "s"}</p>
          <p className="text-[10px] font-semibold text-white/70">Right-click adds waypoints</p>
        </div>
      ) : null}
      <button type="button" onClick={onUndo} aria-label="Undo waypoint" title="Undo waypoint" className="flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-white transition hover:bg-white/10">
        <Undo2 size={17} />
        {!compact ? <span className="text-[10px] font-black uppercase tracking-wider">Undo</span> : null}
      </button>
      <button type="button" onClick={onCancel} aria-label="Cancel movement" title="Cancel movement" className="flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-danger transition hover:bg-danger/10">
        <X size={18} />
        {!compact ? <span className="text-[10px] font-black uppercase tracking-wider">Cancel</span> : null}
      </button>
      <button type="button" onClick={onFinish} aria-label="Finish movement" title="Finish movement" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-black transition hover:bg-[#ffd766]">
        <Check size={18} />
        {!compact ? <span className="text-[10px] font-black uppercase tracking-wider">Finish</span> : null}
      </button>
    </div>
  );
}
