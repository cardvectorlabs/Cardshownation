import { requireAdminSession } from "@/lib/admin-auth";
import { ImportsClient } from "./imports-client";

export const dynamic = "force-dynamic";

export default async function AdminImportsPage() {
  await requireAdminSession("/admin/imports");

  return <ImportsClient />;
}
