import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getRequestIp, isLocalIp } from "@/lib/request-ip";

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req.headers);

  if (isLocalIp(ip)) {
    return NextResponse.json({ lat: null, lng: null, city: null, error: "local" });
  }

  const rateLimit = consumeRateLimit("geoip", ip ?? "unknown", {
    blockMs: 15 * 60 * 1000,
    maxAttempts: 30,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ lat: null, lng: null, error: "rate limited" }, { status: 429 });
  }

  try {
    const res = await fetch(
      `https://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    if (data.status === "success") {
      return NextResponse.json({
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        region: data.regionName,
      });
    }

    return NextResponse.json({ lat: null, lng: null, error: "lookup failed" });
  } catch {
    return NextResponse.json({ lat: null, lng: null, error: "fetch failed" });
  }
}
