import type {
  StrategyKeyframe,
  StrategyMotionPath,
  StrategyMovementRoute,
  StrategyPlacement,
  StrategyRoutePoint,
} from "../types";

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
export const STRATEGY_SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3] as const;
export type StrategySpeed = typeof STRATEGY_SPEED_OPTIONS[number];

export function canEditPublicStrategy(
  isAdmin: boolean,
  username: string,
  editorUsernames: string[],
) {
  const normalizedUsername = normalizeUsername(username);
  return isAdmin || editorUsernames.some(
    (editor) => normalizeUsername(editor) === normalizedUsername,
  );
}

export function canManageStrategyEditors(
  isAdmin: boolean,
  room: "private" | "public",
) {
  return isAdmin && room === "public";
}

export function shouldUseImmersiveStrategyLayout(
  viewportWidth: number,
  viewportHeight = Number.POSITIVE_INFINITY,
) {
  return viewportWidth < 768 || (viewportWidth <= 1100 && viewportHeight < 520);
}

export function shouldOpenStrategyDrawerByDefault(
  viewportWidth: number,
  viewportHeight = Number.POSITIVE_INFINITY,
) {
  return viewportWidth >= 768 && !shouldUseImmersiveStrategyLayout(
    viewportWidth,
    viewportHeight,
  );
}

type PlaceHeroInput = {
  heroId: string;
  heroName: string;
  xPercent: number;
  yPercent: number;
  actorUsername: string;
  now?: string;
};

export function placeStrategyHero(
  placements: StrategyPlacement[],
  input: PlaceHeroInput,
) {
  const now = input.now ?? new Date().toISOString();
  return {
    placements: [
      ...placements,
      {
        id: createStrategyPlacementId(input.heroId),
        heroId: input.heroId,
        heroName: input.heroName,
        xPercent: clampPercent(input.xPercent),
        yPercent: clampPercent(input.yPercent),
        createdBy: input.actorUsername,
        updatedBy: input.actorUsername,
        createdAt: now,
        updatedAt: now,
        teamColor: "unassigned" as const,
      },
    ],
  };
}

function createStrategyPlacementId(heroId: string) {
  return `strategy_${heroId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createStrategyKeyframeId() {
  return `strategy_keyframe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampRoutePoint(point: StrategyRoutePoint) {
  return {
    xPercent: clampPercent(point.xPercent),
    yPercent: clampPercent(point.yPercent),
  };
}

export function createStrategyMotionPathId(
  fromKeyframeId: string,
  toKeyframeId: string,
  placementId: string,
) {
  return `motion_${fromKeyframeId}_${toKeyframeId}_${placementId}`;
}

function cloneStrategyRoute(route?: StrategyMovementRoute): StrategyMovementRoute | undefined {
  if (!route) return undefined;
  return {
    startXPercent: route.startXPercent,
    startYPercent: route.startYPercent,
    endXPercent: route.endXPercent,
    endYPercent: route.endYPercent,
    points: route.points?.map((point) => ({ ...point })),
  };
}

function cloneStrategyPlacement(placement: StrategyPlacement): StrategyPlacement {
  return {
    ...placement,
    movementRoute: cloneStrategyRoute(placement.movementRoute),
  };
}

export function cloneStrategyPlacements(placements: StrategyPlacement[]) {
  return placements.map(cloneStrategyPlacement);
}

export function updateStrategyPlacement(
  placements: StrategyPlacement[],
  placementId: string,
  updates: Partial<Pick<StrategyPlacement, "label" | "teamColor" | "movementRoute">>,
) {
  return placements.map((placement) =>
    placement.id === placementId
      ? { ...placement, ...updates, updatedAt: new Date().toISOString() }
      : placement,
  );
}

export function clearStrategyMovementRoute(
  placements: StrategyPlacement[],
  placementId: string,
) {
  return placements.map((placement) =>
    placement.id === placementId
      ? {
          ...placement,
          movementRoute: undefined,
          updatedAt: new Date().toISOString(),
        }
      : placement,
  );
}

export function duplicateStrategyPlacement(
  placements: StrategyPlacement[],
  placementId: string,
  actorUsername: string,
) {
  const source = placements.find((placement) => placement.id === placementId);
  if (!source) return placements;
  const now = new Date().toISOString();
  return [
    ...placements,
    {
      ...source,
      id: createStrategyPlacementId(source.heroId),
      xPercent: clampPercent(source.xPercent + 3),
      yPercent: clampPercent(source.yPercent + 3),
      movementRoute: undefined,
      createdBy: actorUsername,
      updatedBy: actorUsername,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getStrategyRoutePoints(route: StrategyMovementRoute) {
  if (Array.isArray(route.points) && route.points.length >= 2) {
    return route.points;
  }
  return [
    { xPercent: route.startXPercent, yPercent: route.startYPercent },
    { xPercent: route.endXPercent, yPercent: route.endYPercent },
  ];
}

export function createStrategyMovementRoute(
  points: StrategyRoutePoint[],
): StrategyMovementRoute {
  const safePoints = points.length >= 2 ? points : [
    points[0] ?? { xPercent: 50, yPercent: 50 },
    points[0] ?? { xPercent: 50, yPercent: 50 },
  ];
  const start = safePoints[0]!;
  const end = safePoints.at(-1)!;
  return {
    startXPercent: clampPercent(start.xPercent),
    startYPercent: clampPercent(start.yPercent),
    endXPercent: clampPercent(end.xPercent),
    endYPercent: clampPercent(end.yPercent),
    points: safePoints.map(clampRoutePoint),
  };
}

export function createDefaultStrategyMotionPath(input: {
  fromKeyframeId: string;
  toKeyframeId: string;
  placementId: string;
  from: StrategyPlacement;
  to: StrategyPlacement;
  points?: StrategyRoutePoint[];
  now?: string;
}): StrategyMotionPath {
  const now = input.now ?? new Date().toISOString();
  const points = input.points ?? [
    { xPercent: input.from.xPercent, yPercent: input.from.yPercent },
    { xPercent: input.to.xPercent, yPercent: input.to.yPercent },
  ];

  return {
    id: createStrategyMotionPathId(
      input.fromKeyframeId,
      input.toKeyframeId,
      input.placementId,
    ),
    fromKeyframeId: input.fromKeyframeId,
    toKeyframeId: input.toKeyframeId,
    placementId: input.placementId,
    points: points.map(clampRoutePoint),
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertStrategyMotionPath(
  motionPaths: StrategyMotionPath[],
  nextPath: StrategyMotionPath,
) {
  const index = motionPaths.findIndex((path) => path.id === nextPath.id);
  const normalizedPath = {
    ...nextPath,
    points: nextPath.points.map(clampRoutePoint),
    updatedAt: new Date().toISOString(),
  };

  if (index < 0) return [...motionPaths, normalizedPath];
  return motionPaths.map((path) => path.id === nextPath.id ? normalizedPath : path);
}

export function removeStrategyMotionPath(
  motionPaths: StrategyMotionPath[],
  input: {
    fromKeyframeId: string;
    toKeyframeId: string;
    placementId: string;
  },
) {
  const id = createStrategyMotionPathId(
    input.fromKeyframeId,
    input.toKeyframeId,
    input.placementId,
  );
  return motionPaths.filter((path) => path.id !== id);
}

export function findStrategyMotionPath(
  motionPaths: StrategyMotionPath[],
  input: {
    fromKeyframeId: string;
    toKeyframeId: string;
    placementId: string;
  },
) {
  const id = createStrategyMotionPathId(
    input.fromKeyframeId,
    input.toKeyframeId,
    input.placementId,
  );
  return motionPaths.find((path) => path.id === id);
}

export function normalizeStrategySpeed(value: number): StrategySpeed {
  return STRATEGY_SPEED_OPTIONS.includes(value as StrategySpeed)
    ? value as StrategySpeed
    : 1;
}

export function createStrategyKeyframe(
  placements: StrategyPlacement[],
  index: number,
  options: { id?: string; now?: string } = {},
): StrategyKeyframe {
  const now = options.now ?? new Date().toISOString();
  return {
    id: options.id ?? createStrategyKeyframeId(),
    label: `Keyframe ${index + 1}`,
    placements: cloneStrategyPlacements(placements),
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertStrategyKeyframeSnapshot(
  keyframes: StrategyKeyframe[],
  keyframeId: string,
  placements: StrategyPlacement[],
) {
  return keyframes.map((keyframe) =>
    keyframe.id === keyframeId
      ? {
          ...keyframe,
          placements: cloneStrategyPlacements(placements),
          updatedAt: new Date().toISOString(),
        }
      : keyframe,
  );
}

export function removeStrategyKeyframe(
  keyframes: StrategyKeyframe[],
  keyframeId: string,
) {
  if (keyframes.length <= 1) {
    return {
      keyframes,
      activeKeyframeId: keyframes[0]?.id ?? keyframeId,
    };
  }

  const removedIndex = keyframes.findIndex((keyframe) => keyframe.id === keyframeId);
  const nextKeyframes = keyframes.filter((keyframe) => keyframe.id !== keyframeId);
  const fallbackIndex = Math.max(0, Math.min(removedIndex, nextKeyframes.length - 1));
  return {
    keyframes: nextKeyframes,
    activeKeyframeId: nextKeyframes[fallbackIndex]?.id ?? nextKeyframes[0]!.id,
  };
}

export function createKeyframeTransitionRoute(
  from: StrategyPlacement,
  to: StrategyPlacement,
  motionPath?: StrategyMotionPath,
) {
  return createStrategyMovementRoute(motionPath?.points ?? [
    { xPercent: from.xPercent, yPercent: from.yPercent },
    { xPercent: to.xPercent, yPercent: to.yPercent },
  ]);
}

export function getRenderableStrategyRoutes(placements: StrategyPlacement[]) {
  return placements.flatMap((placement) => placement.movementRoute
    ? [{
        id: placement.id,
        teamColor: placement.teamColor ?? "unassigned" as const,
        route: placement.movementRoute,
      }]
    : []);
}

export function moveStrategyPlacement(
  placements: StrategyPlacement[],
  placementId: string,
  xPercent: number,
  yPercent: number,
  actorUsername = "",
) {
  const now = new Date().toISOString();
  return placements.map((placement) =>
    placement.id === placementId
      ? {
          ...placement,
          xPercent: clampPercent(xPercent),
          yPercent: clampPercent(yPercent),
          updatedBy: actorUsername || placement.updatedBy,
          updatedAt: now,
        }
      : placement,
  );
}

export function removeStrategyPlacement(
  placements: StrategyPlacement[],
  placementId: string,
) {
  return placements.filter((placement) => placement.id !== placementId);
}

export function toggleStrategyEditor(editorUsernames: string[], username: string) {
  const normalizedUsername = normalizeUsername(username);
  const hasEditor = editorUsernames.some(
    (editor) => normalizeUsername(editor) === normalizedUsername,
  );
  return hasEditor
    ? editorUsernames.filter(
        (editor) => normalizeUsername(editor) !== normalizedUsername,
      )
    : [...editorUsernames, normalizedUsername];
}
