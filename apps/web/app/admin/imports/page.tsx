import { requireAdminSession } from "@/lib/admin-auth";
import { getAutoImportSourceSummaries } from "@/lib/scheduled-imports";
import { ImportsClient } from "./imports-client";

export const dynamic = "force-dynamic";

export default async function AdminImportsPage() {
  await requireAdminSession("/admin/imports");
  const sources = await getAutoImportSourceSummaries();

  return <ImportsClient sources={sources} />;
}
