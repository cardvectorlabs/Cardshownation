"use server";

import { redirect } from "next/navigation";
import { endModeratorSession } from "@/lib/moderator-auth";

export async function logoutModerator() {
  await endModeratorSession();
  redirect("/moderator/login");
}

