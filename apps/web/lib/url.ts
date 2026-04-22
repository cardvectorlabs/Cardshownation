const MAX_EXTERNAL_URL_LENGTH = 2048;

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeExternalUrl(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_EXTERNAL_URL_LENGTH) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeLocalRedirectTarget(value: unknown, fallback = "/admin") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.startsWith("/admin/login")) {
    return fallback;
  }

  return trimmed;
}
