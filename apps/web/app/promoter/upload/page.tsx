import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePromoterSession } from "@/lib/promoter-auth";
import { PromoterUploadForm } from "./upload-form";

export const metadata: Metadata = {
  title: "Bulk Upload Shows",
  description: "Upload multiple shows at once from the Card Show Nation promoter portal.",
};

export const dynamic = "force-dynamic";

export default async function PromoterShowUploadPage() {
  await requirePromoterSession("/promoter/upload");

  return (
    <div className="container-narrow py-6 sm:py-10">
      <Link
        href="/promoter"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to promoter portal
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Upload Shows From CSV
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Add multiple shows in one pass using the promoter CSV format. This is best for repeat organizers posting a full season or tour schedule.
        </p>
      </div>

      <PromoterUploadForm />
    </div>
  );
}
