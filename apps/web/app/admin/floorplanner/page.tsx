import { requireAdminSession } from "@/lib/admin-auth";
import { FloorplanEditorPage } from "@/app/floorplanner/editor-page";

export const dynamic = "force-dynamic";

export default async function AdminFloorplannerPage() {
  await requireAdminSession("/admin/floorplanner");

  return (
    <div className="flex h-screen min-h-[720px] flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Admin Workspace
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">Floorplanner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Standalone planning workspace with optional show assignment deferred.
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <FloorplanEditorPage
          cloudBasePath="/api/floorplanner"
          showLabel="Admin Workspace"
          storageNamespace="admin"
        />
      </div>
    </div>
  );
}
