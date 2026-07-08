import type {
  StrategyMovementRoute,
  StrategyPlacement,
  StrategyRoutePoint,
} from "../types";

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

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
    points: safePoints.map((point) => ({
      xPercent: clampPercent(point.xPercent),
      yPercent: clampPercent(point.yPercent),
    })),
  };
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
