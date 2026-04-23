"use server";

import { redirect } from "next/navigation";
import { endUserSession } from "@/lib/user-auth";

export async function logoutUser() {
  await endUserSession();
  redirect("/account/login");
}
