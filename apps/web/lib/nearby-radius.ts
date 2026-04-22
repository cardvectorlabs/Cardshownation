export const NEARBY_RADIUS_OPTIONS = [25, 50, 100, 200] as const;

export const DEFAULT_NEARBY_RADIUS = 100;

export function normalizeNearbyRadius(value: string | number | null | undefined) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_NEARBY_RADIUS;
  }

  return NEARBY_RADIUS_OPTIONS.includes(parsed as (typeof NEARBY_RADIUS_OPTIONS)[number])
    ? parsed
    : DEFAULT_NEARBY_RADIUS;
}
