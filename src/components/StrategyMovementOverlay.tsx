import type { StrategyMovementRoute, StrategyPlacement } from "../types";

type RouteItem = {
  id: string;
  teamColor: NonNullable<StrategyPlacement["teamColor"]>;
  route: StrategyMovementRoute;
};

export function StrategyMovementOverlay({ routes, preview }: { routes: RouteItem[]; preview?: RouteItem | null }) {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        {(["unassigned", "blue", "red"] as const).map((color) => <marker key={color} id={`strategy-arrow-${color}`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" className={`strategy-route-${color}`} fill="currentColor" /></marker>)}
      </defs>
      {[...routes, ...(preview ? [preview] : [])].map((item) => <line key={item.id} x1={item.route.startXPercent} y1={item.route.startYPercent} x2={item.route.endXPercent} y2={item.route.endYPercent} vectorEffect="non-scaling-stroke" markerEnd={`url(#strategy-arrow-${item.teamColor})`} className={`strategy-route strategy-route-${item.teamColor} ${preview?.id === item.id ? "strategy-route-preview" : ""}`} />)}
    </svg>
  );
}
