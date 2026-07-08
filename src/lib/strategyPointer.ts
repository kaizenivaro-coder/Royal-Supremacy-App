export type StrategyPointerIntent = "pending" | "drag" | "movement";

export function classifyStrategyPointerIntent(
  distancePixels: number,
  elapsedMs: number,
): StrategyPointerIntent {
  if (distancePixels >= 6) return "drag";
  if (elapsedMs >= 500) return "movement";
  return "pending";
}

export function getMovementDurationMs(distancePixels: number, speedPixelsPerSecond = 160) {
  const duration = (Math.max(0, distancePixels) / speedPixelsPerSecond) * 1000;
  return Math.round(Math.min(5000, Math.max(500, duration)));
}
