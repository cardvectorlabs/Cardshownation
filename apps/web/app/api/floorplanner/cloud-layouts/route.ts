import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { validateDocumentSlice } from "@floorplanner/lib/document-schema";
import {
  CloudLayoutConflictError,
  ensureCloudLayoutsTable,
  isCloudSaveConfigured,
  listCloudLayouts,
  upsertCloudLayout,
} from "@floorplanner/lib/server/cloud-layout-store";
import { authorizeCloudRequest, isCloudAuthConfigured } from "@floorplanner/lib/server/cloud-auth";
import { getAdminSession } from "@/lib/admin-auth";

function unavailableResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 503 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function isStandaloneCloudConfigured() {
  return isCloudAuthConfigured() && isCloudSaveConfigured();
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  if (!isStandaloneCloudConfigured()) {
    return unavailableResponse("Cloud save is not configured.");
  }
  if (!authorizeCloudRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    await ensureCloudLayoutsTable();
    const layouts = await listCloudLayouts();
    return NextResponse.json({ layouts });
  } catch {
    return unavailableResponse("Failed to list floorplans.");
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  if (!isStandaloneCloudConfigured()) {
    return unavailableResponse("Cloud save is not configured.");
  }
  if (!authorizeCloudRequest(request)) {
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
    await ensureCloudLayoutsTable();
    const layout = await upsertCloudLayout({
      id: body.id ?? randomUUID(),
      name: body.name.trim(),
      data,
      expectedRevision:
        typeof body.expectedRevision === "number" ? body.expectedRevision : null,
    });

    return NextResponse.json({ layout });
  } catch (error) {
    if (error instanceof CloudLayoutConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "revision-conflict",
          currentLayout: error.currentLayout,
        },
        { status: 409 },
      );
    }

    return unavailableResponse("Failed to save floorplan.");
  }
}
