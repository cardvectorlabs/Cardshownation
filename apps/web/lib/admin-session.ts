const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SESSION_AUDIENCE = "card-show-nation-admin";

type AdminSessionPayload = {
  aud: string;
  exp: number;
  iat: number;
  nonce: string;
  v: number;
};

export const ADMIN_COOKIE_NAME = "csn_admin";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function toBase64Url(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function encodePayload(payload: AdminSessionPayload) {
  return toBase64Url(encoder.encode(JSON.stringify(payload)));
}

function decodePayload(payloadSegment: string) {
  try {
    const parsed = JSON.parse(decoder.decode(fromBase64Url(payloadSegment))) as Partial<AdminSessionPayload>;
    if (
      parsed.aud !== SESSION_AUDIENCE ||
      parsed.v !== 1 ||
      typeof parsed.exp !== "number" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.nonce !== "string" ||
      parsed.nonce.length === 0
    ) {
      return null;
    }

    return parsed as AdminSessionPayload;
  } catch {
    return null;
  }
}

async function signPayload(payloadSegment: string, secret: string) {
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadSegment));

  return toBase64Url(signature);
}

export async function createAdminSessionToken(
  secret: string,
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    aud: SESSION_AUDIENCE,
    exp: now + maxAgeSeconds,
    iat: now,
    nonce: crypto.randomUUID(),
    v: 1,
  };
  const payloadSegment = encodePayload(payload);
  const signatureSegment = await signPayload(payloadSegment, secret);
  return `${payloadSegment}.${signatureSegment}`;
}

export async function verifyAdminSessionToken(token: string | undefined, secret: string) {
  if (!token) {
    return false;
  }

  try {
    const [payloadSegment, signatureSegment, extraSegment] = token.split(".");
    if (!payloadSegment || !signatureSegment || extraSegment) {
      return false;
    }

    const payload = decodePayload(payloadSegment);
    if (!payload) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now || payload.iat > now + 60) {
      return false;
    }

    const key = await getSigningKey(secret);

    return crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signatureSegment),
      encoder.encode(payloadSegment)
    );
  } catch {
    return false;
  }
}
