import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "";

  const isLocal =
    !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.");

  if (isLocal) {
    return NextResponse.json({ lat: null, lng: null, city: null, error: "local" });
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
