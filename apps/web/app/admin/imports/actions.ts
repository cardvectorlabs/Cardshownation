"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import { runEventbriteImport } from "@/lib/eventbrite-import";

export async function triggerEventbriteImport() {
  await requireAdminSession("/admin/imports");
  return runEventbriteImport();
}
