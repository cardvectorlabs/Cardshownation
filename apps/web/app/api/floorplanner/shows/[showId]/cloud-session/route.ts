import { NextRequest, NextResponse } from "next/server";
import { getFloorplanAccess, unauthorizedResponse } from "../shared";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ showId: string }> }
) {
  const { showId } = await context.params;
  const access = await getFloorplanAccess(showId);

  return NextResponse.json({
    available: true,
    authenticated: Boolean(access),
  });
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ showId: string }> }
) {
  const { showId } = await context.params;
  const access = await getFloorplanAccess(showId);
  if (!access) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ authenticated: true });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ showId: string }> }
) {
  const { showId } = await context.params;
  const access = await getFloorplanAccess(showId);
  if (!access) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ authenticated: true });
}
