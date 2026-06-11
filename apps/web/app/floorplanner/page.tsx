import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getModeratorSession } from "@/lib/moderator-auth";

export const dynamic = "force-dynamic";

export default async function FloorplannerPage() {
  const [adminSession, moderatorSession] = await Promise.all([
    getAdminSession(),
    getModeratorSession(),
  ]);

  if (adminSession) {
    redirect("/admin/floorplanner");
  }

  if (moderatorSession) {
    redirect("/moderator/floorplanner");
  }

  redirect("/admin/login?from=%2Fadmin%2Ffloorplanner");
}
