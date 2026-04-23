import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin-auth";
import { isFixtureMode } from "@/lib/data-mode";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function AdminShowUploadPage() {
  await requireAdminSession("/admin/shows/upload");

  return (
    <div className="container-narrow py-6 sm:py-10">
      <Link
        href="/admin/shows"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shows
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Upload Shows From CSV
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Import multiple approved show records in one pass using the admin CSV format.
        </p>
      </div>

      {isFixtureMode() ? (
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 shadow-sm">
          CSV bulk upload is unavailable in fixture mode because this route writes directly to the live database.
        </div>
      ) : (
        <UploadForm />
      )}
    </div>
  );
}
