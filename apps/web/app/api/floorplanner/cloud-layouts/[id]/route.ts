import { NextRequest, NextResponse } from "next/server";
import {
  deleteCloudLayout,
  ensureCloudLayoutsTable,
  getCloudLayout,
  isCloudSaveConfigured,
} from "@floorplanner/lib/server/cloud-layout-store";
import { authorizeCloudRequest, isCloudAuthConfigured } from "@floorplanner/lib/server/cloud-auth";
import { getFloorplannerOperatorSession } from "@/lib/floorplanner-operator-auth";

function unavailableResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 503 });
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

function notFoundResponse() {
  return NextResponse.json({ error: "Floorplan not found." }, { status: 404 });
}

function isStandaloneCloudConfigured() {
  return isCloudAuthConfigured() && isCloudSaveConfigured();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getFloorplannerOperatorSession();
  if (!session) {
    return unauthorizedResponse();
  }

  if (!isStandaloneCloudConfigured()) {
    return unavailableResponse("Cloud save is not configured.");
  }
  if (!authorizeCloudRequest(request)) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;

  await ensureCloudLayoutsTable();
  const layout = await getCloudLayout(id, {
    userId: session.user.id,
    role: session.role,
  });
  if (!layout) {
    return notFoundResponse();
  }

  return NextResponse.json({ layout });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getFloorplannerOperatorSession();
  if (!session) {
    return unauthorizedResponse();
  }

  if (!isStandaloneCloudConfigured()) {
    return unavailableResponse("Cloud save is not configured.");
  }
  if (!authorizeCloudRequest(request)) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  await ensureCloudLayoutsTable();
  await deleteCloudLayout(id, {
    userId: session.user.id,
    role: session.role,
  });
  return NextResponse.json({ ok: true });
}
