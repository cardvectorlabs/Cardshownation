export const FLYER_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const FLYER_REQUIRED_WIDTH = 1200;
export const FLYER_REQUIRED_HEIGHT = 1600;

export const FLYER_ACCEPTED_MIME_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const FLYER_ACCEPTED_EXTENSIONS = [
  ".webp",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

export function isAcceptedFlyerFile(file: Pick<File, "name" | "type">) {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.trim().toLowerCase();

  return (
    (!mimeType ||
      FLYER_ACCEPTED_MIME_TYPES.includes(
        mimeType as (typeof FLYER_ACCEPTED_MIME_TYPES)[number]
      )) &&
    FLYER_ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension))
  );
}
