"use server";

import { redirect } from "next/navigation";
import { endPromoterSession } from "@/lib/promoter-auth";

export async function logoutPromoter() {
  await endPromoterSession();
  redirect("/promoter");
}
