import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { normalizeExternalUrl } from "@/lib/url";
import {
  FLYER_MAX_SIZE_BYTES,
  FLYER_REQUIRED_HEIGHT,
  FLYER_REQUIRED_WIDTH,
  isAcceptedFlyerFile,
} from "@/lib/flyer-spec";
import { slugify } from "@/lib/utils";

const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
const isProduction = process.env.NODE_ENV === "production";
const FLYER_BACKGROUND = { r: 248, g: 250, b: 252, alpha: 1 };
const FLYER_REMOTE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

function getAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://cardshownation.com").replace(/\/$/, "");
}

function buildLocalFlyerUrl(pathname: string) {
  return new URL(pathname, `${getAppBaseUrl()}/`).toString();
}

export function normalizeFlyerUrlForRender(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return buildLocalFlyerUrl(trimmed);
  }

  return normalizeExternalUrl(trimmed);
}

export function isManagedFlyerUrl(value: string | null | undefined) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("/uploads/flyers/")) {
    return true;
  }

  const normalized = normalizeExternalUrl(trimmed);
  if (!normalized) {
    return false;
  }

  const url = new URL(normalized);
  const appHost = new URL(getAppBaseUrl()).host;
  const isLocalFlyerPath = url.host === appHost && url.pathname.startsWith("/uploads/flyers/");
  const isBlobFlyerPath =
    url.host.includes("vercel-storage.com") &&
    url.pathname.includes("/flyers/") &&
    url.pathname.toLowerCase().endsWith(".webp");

  return isLocalFlyerPath || isBlobFlyerPath;
}

export async function normalizeFlyerImage(bytes: Buffer) {
  const sharp = (await import("sharp")).default;

  try {
    return await sharp(bytes)
      .rotate()
      .resize(FLYER_REQUIRED_WIDTH, FLYER_REQUIRED_HEIGHT, {
        fit: "contain",
        background: FLYER_BACKGROUND,
        position: "centre",
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("Flyers must be valid JPG, PNG, or WebP images.");
  }
}

async function persistNormalizedFlyer(showName: string, normalizedBytes: Buffer) {
  const baseName = slugify(showName) || "show-flyer";
  const finalName = `${baseName}-${randomUUID()}.webp`;

  if (blobReadWriteToken) {
    const blob = await put(`flyers/${finalName}`, normalizedBytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/webp",
      token: blobReadWriteToken,
    });

    return blob.url;
  }

  if (isProduction) {
    throw new Error("Flyer uploads require BLOB_READ_WRITE_TOKEN in production.");
  }

  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "flyers");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, finalName), normalizedBytes);

  return `/uploads/flyers/${finalName}`;
}

async function readResponseBytes(response: Response, maxBytes: number) {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(parsedLength) && parsedLength > maxBytes) {
      throw new Error(`Flyer source file is too large. Keep it under ${Math.floor(maxBytes / (1024 * 1024))} MB.`);
    }
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new Error(`Flyer source file is too large. Keep it under ${Math.floor(maxBytes / (1024 * 1024))} MB.`);
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Flyer source file is too large. Keep it under ${Math.floor(maxBytes / (1024 * 1024))} MB.`);
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, total);
}

export async function saveRemoteFlyerImage(showName: string, sourceUrl: string) {
  const normalizedSourceUrl = normalizeExternalUrl(sourceUrl);
  if (!normalizedSourceUrl) {
    throw new Error("Flyer URL must be a valid http or https image.");
  }

  const response = await fetch(normalizedSourceUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not download the flyer image from that URL.");
  }

  const sourceBytes = await readResponseBytes(response, FLYER_REMOTE_MAX_SIZE_BYTES);
  const normalizedBytes = await normalizeFlyerImage(sourceBytes);
  return persistNormalizedFlyer(showName, normalizedBytes);
}

export async function resolveManagedFlyerImageUrl(
  showName: string,
  flyerImageUrl: string | null | undefined
) {
  if (typeof flyerImageUrl !== "string") {
    return null;
  }

  const trimmed = flyerImageUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (isManagedFlyerUrl(trimmed)) {
    return trimmed;
  }

  return saveRemoteFlyerImage(showName, trimmed);
}

export async function saveFlyerImage(showName: string, file: File) {
  if (!file.size) {
    return null;
  }

  if (!isAcceptedFlyerFile(file) || file.size > FLYER_MAX_SIZE_BYTES) {
    throw new Error("Flyers must be JPG, PNG, or WebP images under 2 MB.");
  }

  const normalizedBytes = await normalizeFlyerImage(Buffer.from(await file.arrayBuffer()));
  return persistNormalizedFlyer(showName, normalizedBytes);
}
