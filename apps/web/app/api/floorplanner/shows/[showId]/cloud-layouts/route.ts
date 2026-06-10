import { NextRequest, NextResponse } from "next/server";
import { validateDocumentSlice } from "@floorplanner/lib/document-schema";
import { listShowFloorplans, saveShowFloorplan, ShowFloorplanRevisionConflictError } from "@/lib/floorplans";
import { getFloorplanAccess, unauthorizedResponse } from "../shared";

function unavailableResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 503 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ showId: string }> }
) {
  const { showId } = await context.params;
  const access = await getFloorplanAccess(showId);
  if (!access) {
    return unauthorizedResponse();
  }

  try {
    const layouts = await listShowFloorplans(showId);
    return NextResponse.json({ layouts });
  } catch {
    return unavailableResponse("Failed to list floorplans.");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ showId: string }> }
) {
  const { showId } = await context.params;
  const access = await getFloorplanAccess(showId);
  if (!access) {
    return unauthorizedResponse();
  }

  let body: {
    id?: string | null;
    name?: string;
    data?: unknown;
    expectedRevision?: number | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return badRequest("Layout name is required.");
  }

  let data;
  try {
    data = validateDocumentSlice(body.data);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid floorplan data.");
  }

  try {
    const layout = await saveShowFloorplan({
      id: body.id ?? null,
      showId,
      venueId: access.show.venueId,
      name: body.name,
      data,
      actorUserId: access.actorUserId,
      expectedRevision:
        typeof body.expectedRevision === "number" ? body.expectedRevision : null,
    });

    return NextResponse.json({ layout });
  } catch (error) {
    if (error instanceof ShowFloorplanRevisionConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "revision-conflict",
          currentLayout: error.currentLayout,
        },
        { status: 409 }
      );
    }

    return unavailableResponse("Failed to save floorplan.");
  }
}
