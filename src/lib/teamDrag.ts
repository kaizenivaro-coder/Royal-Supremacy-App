export type DragPoint = {
  x: number;
  y: number;
};

export type TeamDropZone = {
  teamName: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function getTeamDropTarget(
  zones: TeamDropZone[],
  point: DragPoint,
): string | null {
  const target = zones.find(
    (zone) =>
      point.x >= zone.left &&
      point.x <= zone.right &&
      point.y >= zone.top &&
      point.y <= zone.bottom,
  );

  return target?.teamName ?? null;
}
