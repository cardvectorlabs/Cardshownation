import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  FLYER_REQUIRED_HEIGHT,
  FLYER_REQUIRED_WIDTH,
  isAcceptedFlyerFile,
} from "./flyer-spec";
import {
  isManagedFlyerUrl,
  normalizeFlyerImage,
  normalizeFlyerUrlForRender,
} from "./flyers";

test("normalizeFlyerImage converts source artwork into the required webp canvas", async () => {
  const source = await sharp({
    create: {
      width: 2000,
      height: 1000,
      channels: 3,
      background: { r: 220, g: 38, b: 38 },
    },
  })
    .png()
    .toBuffer();

  const normalized = await normalizeFlyerImage(source);
  const metadata = await sharp(normalized).metadata();

  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, FLYER_REQUIRED_WIDTH);
  assert.equal(metadata.height, FLYER_REQUIRED_HEIGHT);
});

test("isAcceptedFlyerFile allows jpg, png, and webp uploads", () => {
  assert.equal(isAcceptedFlyerFile({ name: "flyer.jpg", type: "image/jpeg" } as File), true);
  assert.equal(isAcceptedFlyerFile({ name: "flyer.png", type: "image/png" } as File), true);
  assert.equal(isAcceptedFlyerFile({ name: "flyer.webp", type: "image/webp" } as File), true);
  assert.equal(isAcceptedFlyerFile({ name: "flyer.gif", type: "image/gif" } as File), false);
});

test("normalizeFlyerUrlForRender expands local flyer paths", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://www.cardshownation.com";

  assert.equal(
    normalizeFlyerUrlForRender("/uploads/flyers/example.webp"),
    "https://www.cardshownation.com/uploads/flyers/example.webp"
  );

  process.env.NEXT_PUBLIC_APP_URL = originalBaseUrl;
});

test("isManagedFlyerUrl recognizes stored local and blob flyer assets", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://www.cardshownation.com";

  assert.equal(isManagedFlyerUrl("/uploads/flyers/example.webp"), true);
  assert.equal(
    isManagedFlyerUrl("https://www.cardshownation.com/uploads/flyers/example.webp"),
    true
  );
  assert.equal(
    isManagedFlyerUrl("https://pub-123.public.blob.vercel-storage.com/flyers/example.webp"),
    true
  );
  assert.equal(isManagedFlyerUrl("https://example.com/flyers/example.webp"), false);

  process.env.NEXT_PUBLIC_APP_URL = originalBaseUrl;
});
