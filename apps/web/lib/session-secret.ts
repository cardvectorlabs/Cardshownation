export function validateSessionSecret(secret: string | null | undefined, minLength: number) {
  const normalized = secret?.trim() || null;
  if (!normalized) {
    return { secret: null, error: "missing" as const };
  }

  if (normalized.length < minLength) {
    return { secret: null, error: "too_short" as const };
  }

  return { secret: normalized, error: null };
}
