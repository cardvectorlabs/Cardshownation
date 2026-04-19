"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, X } from "lucide-react";

export function NearMeButton({
  isActive,
  radiusMiles = 100,
}: {
  isActive: boolean;
  radiusMiles?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isActive) {
      router.push("/card-shows");
      return;
    }

    setLoading(true);
    setError(null);

    async function navigateWithIp() {
      try {
        const res = await fetch("/api/geoip");
        const data = await res.json();
        if (data.lat && data.lng) {
          router.push(`/card-shows?lat=${data.lat}&lng=${data.lng}&radius=${radiusMiles}`);
        } else {
          setError("Could not determine your location");
          setLoading(false);
        }
      } catch {
        setError("Could not determine your location");
        setLoading(false);
      }
    }

    if (!navigator?.geolocation) {
      navigateWithIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        router.push(
          `/card-shows?lat=${coords.latitude.toFixed(5)}&lng=${coords.longitude.toFixed(5)}&radius=${radiusMiles}`
        );
        setLoading(false);
      },
      () => navigateWithIp(),
      { timeout: 8000 }
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          isActive
            ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isActive ? (
          <X className="h-4 w-4" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {isActive ? "Clear near me" : "Near me"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
