import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import {
  FLYER_MAX_SIZE_BYTES,
  FLYER_REQUIRED_HEIGHT,
  FLYER_REQUIRED_WIDTH,
} from "@/lib/flyer-spec";
import { slugify } from "@/lib/utils";

const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
const isProduction = process.env.NODE_ENV === "production";

function readUInt24LE(buffer: Buffer, offset: number) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseVp8XDimensions(buffer: Buffer, chunkOffset: number) {
  return {
    width: readUInt24LE(buffer, chunkOffset + 12) + 1,
    height: readUInt24LE(buffer, chunkOffset + 15) + 1,
  };
}

function parseVp8LDimensions(buffer: Buffer, chunkOffset: number) {
  const dataOffset = chunkOffset + 8;
  if (buffer[dataOffset] !== 0x2f) {
    throw new Error("Invalid WebP lossless header.");
  }

  const b0 = buffer[dataOffset + 1];
  const b1 = buffer[dataOffset + 2];
  const b2 = buffer[dataOffset + 3];
  const b3 = buffer[dataOffset + 4];

  return {
    width: 1 + (b0 | ((b1 & 0x3f) << 8)),
    height: 1 + (((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10))),
  };
}

function parseVp8Dimensions(buffer: Buffer, chunkOffset: number) {
  const dataOffset = chunkOffset + 8;
  const startCodeOffset = dataOffset + 3;

  if (
    buffer[startCodeOffset] !== 0x9d ||
    buffer[startCodeOffset + 1] !== 0x01 ||
    buffer[startCodeOffset + 2] !== 0x2a
  ) {
    throw new Error("Invalid WebP lossy header.");
  }

  return {
    width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
    height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
  };
}

function getWebPDimensions(buffer: Buffer) {
  if (buffer.length < 30) {
    throw new Error("WebP file is too small.");
  }

  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("File is not a valid WebP image.");
  }

  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkType === "VP8X") {
      return parseVp8XDimensions(buffer, offset);
    }

    if (chunkType === "VP8L") {
      return parseVp8LDimensions(buffer, offset);
    }

    if (chunkType === "VP8 ") {
      return parseVp8Dimensions(buffer, offset);
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  throw new Error("Unable to determine WebP dimensions.");
}

export async function saveFlyerImage(showName: string, file: File) {
  if (!file.size) {
    return null;
  }

  const fileName = file.name.toLowerCase();
  if (
    file.type !== "image/webp" ||
    !fileName.endsWith(".webp") ||
    file.size > FLYER_MAX_SIZE_BYTES
  ) {
    throw new Error("Flyers must be .webp images under 2 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dimensions = getWebPDimensions(bytes);

  if (
    dimensions.width !== FLYER_REQUIRED_WIDTH ||
    dimensions.height !== FLYER_REQUIRED_HEIGHT
  ) {
    throw new Error(
      `Flyers must be ${FLYER_REQUIRED_WIDTH}x${FLYER_REQUIRED_HEIGHT}px WebP images.`
    );
  }

  const baseName = slugify(showName) || "show-flyer";
  const finalName = `${baseName}-${randomUUID()}.webp`;

  if (blobReadWriteToken) {
    const blob = await put(`flyers/${finalName}`, bytes, {
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
  await writeFile(path.join(uploadDirectory, finalName), bytes);

  return `/uploads/flyers/${finalName}`;
}
