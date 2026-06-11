import { getAdminSession } from "@/lib/admin-auth";
import { getModeratorSession } from "@/lib/moderator-auth";

type AdminSession = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;
type ModeratorSession = NonNullable<Awaited<ReturnType<typeof getModeratorSession>>>;

export type FloorplannerOperatorSession =
  | {
      role: "ADMIN";
      user: AdminSession["user"];
    }
  | {
      role: "MODERATOR";
      user: ModeratorSession["user"];
    };

export async function getFloorplannerOperatorSession(): Promise<FloorplannerOperatorSession | null> {
  const adminSession = await getAdminSession();
  if (adminSession) {
    return {
      role: "ADMIN",
      user: adminSession.user,
    };
  }

  const moderatorSession = await getModeratorSession();
  if (moderatorSession) {
    return {
      role: "MODERATOR",
      user: moderatorSession.user,
    };
  }

  return null;
}
