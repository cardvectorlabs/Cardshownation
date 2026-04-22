"use client";

import { type ChangeEvent, useRef, useState } from "react";
import {
  FLYER_MAX_SIZE_BYTES,
  FLYER_REQUIRED_HEIGHT,
  FLYER_REQUIRED_WIDTH,
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

    if (file.type !== "image/webp" || !file.name.toLowerCase().endsWith(".webp")) {
      setMessage("Flyer must be a .webp image.");
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

      if (
        dimensions.width !== FLYER_REQUIRED_WIDTH ||
        dimensions.height !== FLYER_REQUIRED_HEIGHT
      ) {
        setMessage(
          `Flyer must be ${FLYER_REQUIRED_WIDTH}x${FLYER_REQUIRED_HEIGHT}px.`
        );
        setIsValid(false);
        event.target.value = "";
        return;
      }

      setMessage(
        `Flyer ready: ${dimensions.width}x${dimensions.height}px WebP.`
      );
      setIsValid(true);
    } catch {
      setMessage("Unable to read this file. Please try another WebP image.");
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
            Optional. Use WebP only at {FLYER_REQUIRED_WIDTH}x{FLYER_REQUIRED_HEIGHT}
            px for the mobile card layout.
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
          accept=".webp,image/webp"
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
          "Recommended export: portrait artwork with legible date, city, and venue at phone size."}
      </p>
    </div>
  );
}
