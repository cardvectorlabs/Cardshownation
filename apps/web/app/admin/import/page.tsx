import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Import Shows</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bulk-import shows from a CSV file. Download the template to see the
          expected format. Existing shows matched by slug will be updated.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
