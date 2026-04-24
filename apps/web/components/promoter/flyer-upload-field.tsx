"use client";

import { type ChangeEvent, useRef, useState } from "react";
import {
  FLYER_ACCEPTED_EXTENSIONS,
  FLYER_MAX_SIZE_BYTES,
  FLYER_REQUIRED_HEIGHT,
  FLYER_REQUIRED_WIDTH,
  isAcceptedFlyerFile,
} from "@/lib/flyer-spec";

type FlyerUploadFieldProps = {
  inputClass: string;
};

export function FlyerUploadField({ inputClass }: FlyerUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage(null);
      setIsValid(true);
      return;
    }

    if (!isAcceptedFlyerFile(file)) {
      setMessage("Flyer must be a JPG, PNG, or WebP image.");
      setIsValid(false);
      event.target.value = "";
      return;
    }

    if (file.size > FLYER_MAX_SIZE_BYTES) {
      setMessage("Flyer must be 2 MB or smaller.");
      setIsValid(false);
      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    try {
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
          };
          image.onerror = () => reject(new Error("Unable to read image."));
          image.src = imageUrl;
        }
      );

      setMessage(
        `Flyer ready: ${dimensions.width}x${dimensions.height}px. We'll fit it to ${FLYER_REQUIRED_WIDTH}x${FLYER_REQUIRED_HEIGHT}px WebP automatically.`
      );
      setIsValid(true);
    } catch {
      setMessage("Unable to read this file. Please try another image.");
      setIsValid(false);
      event.target.value = "";
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Flyer upload</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Optional. Upload a JPG, PNG, or WebP image and we will convert it to a{" "}
            {FLYER_REQUIRED_WIDTH}x{FLYER_REQUIRED_HEIGHT}px WebP flyer for the mobile
            card layout.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          Max 2 MB
        </span>
      </div>

      <div className="mt-4">
        <input
          ref={inputRef}
          id="flyerFile"
          name="flyerFile"
          type="file"
          accept={FLYER_ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <p
        className={`mt-3 text-sm ${
          message
            ? isValid
              ? "text-green-700"
              : "text-red-700"
            : "text-slate-500"
        }`}
      >
        {message ??
          "Recommended artwork: portrait-oriented flyer with the date, city, and venue large enough to survive automatic fitting."}
      </p>
    </div>
  );
}
