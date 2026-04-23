"use server";

import { redirect } from "next/navigation";
import { endAdminSession } from "@/lib/admin-auth";

export async function logoutAdmin() {
  await endAdminSession();
  redirect("/admin/login");
}
