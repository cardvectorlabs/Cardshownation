import { NextResponse } from "next/server";
import { getAdminFloorplanAccess, getPromoterFloorplanAccess, type FloorplanAccess } from "@/lib/floorplan-auth";

export async function getFloorplanAccess(showId: string): Promise<FloorplanAccess | null> {
  const promoterAccess = await getPromoterFloorplanAccess(showId);
  if (promoterAccess) {
    return promoterAccess;
  }

  return getAdminFloorplanAccess(showId);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}
