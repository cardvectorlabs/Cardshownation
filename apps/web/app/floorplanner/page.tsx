import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function FloorplannerPage() {
  await requireAdminSession("/admin/floorplanner");
  redirect("/admin/floorplanner");
}
