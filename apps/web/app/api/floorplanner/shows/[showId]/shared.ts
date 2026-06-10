import { NextResponse } from "next/server";
import { getAdminFloorplanAccess, type FloorplanAccess } from "@/lib/floorplan-auth";

export async function getFloorplanAccess(showId: string): Promise<FloorplanAccess | null> {
  return getAdminFloorplanAccess(showId);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}
