import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubmitShowFormSteps } from "@/components/submit/submit-show-form-steps";
import { SHOW_CATEGORIES } from "@/lib/shows";
import { US_STATES } from "@/lib/states";
import { createShowSubmission } from "@/lib/submissions";

export const metadata: Metadata = {
  title: "Submit a Card Show",
  description:
    "Submit a sports card, Pokemon, or TCG show to Card Show Nation for review.",
};

async function handleSubmission(formData: FormData) {
  "use server";

  const getRequiredString = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const getOptionalString = (key: string) => {
    const value = formData.get(key);
    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  };

  const submitterEmail = getRequiredString("submitterEmail");
  const submitterNameInput = getOptionalString("submitterName");

  if (!submitterEmail) return;

  const submitterName = submitterNameInput ?? deriveSubmitterName(submitterEmail);
  const startDate = getRequiredString("startDate");
  const endDate = getRequiredString("endDate") || startDate;

  const payload = {
    showName: getRequiredString("showName"),
    startDate,
    endDate,
    startTimeLabel: getOptionalString("startTimeLabel"),
    endTimeLabel: getOptionalString("endTimeLabel"),
    city: getRequiredString("city"),
    state: getRequiredString("state"),
    venueName: getRequiredString("venueName"),
    venueAddress: getOptionalString("venueAddress"),
    categories: formData
      .getAll("categories")
      .filter((value): value is string => typeof value === "string"),
    organizerName: submitterName,
    organizerEmail: submitterEmail,
    description: getOptionalString("description"),
    tableCount: getOptionalString("tableCount"),
    vendorDetails: getOptionalString("vendorDetails"),
    websiteUrl: getOptionalString("websiteUrl"),
    facebookUrl: getOptionalString("facebookUrl"),
    isFree: formData.get("isFree") === "free",
    admissionPrice: getOptionalString("admissionPrice"),
    admissionNotes: getOptionalString("admissionNotes"),
    parkingInfo: getOptionalString("parkingInfo"),
  };

  await createShowSubmission({
    submitterName,
    submitterEmail,
    payloadJson: payload,
  });

  redirect("/submit-show/thank-you");
}

function deriveSubmitterName(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const cleaned = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "Card Show Promoter";
  }

  return cleaned
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildTimeOptions() {
  const options: string[] = [];

  for (let hour = 6; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMinute = minute === 0 ? "00" : "30";
      options.push(`${displayHour}:${displayMinute} ${period}`);
    }
  }

  options.push("10:00 PM");

  return options;
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none";

const timeOptions = buildTimeOptions();

export default function SubmitShowPage() {
  return (
    <div className="container-narrow py-6 sm:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Promoter submission
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          List your card show - free
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Reach collectors searching for shows in your city. Takes under a
          minute. No account needed. We review and publish within 24 hours.
        </p>
        <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-brand-600">
              ✓
            </span>
            Free listing
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-brand-600">
              ✓
            </span>
            Live within 24 hours
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-brand-600">
              ✓
            </span>
            No account needed
          </li>
        </ul>
      </div>

      <form action={handleSubmission} className="mt-8 space-y-8">
        <SubmitShowFormSteps
          categories={SHOW_CATEGORIES}
          inputClass={inputClass}
          states={US_STATES}
          timeOptions={timeOptions}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500">
            Free listing. We review and publish within 24 hours. We&apos;ll
            only email you if we need to clarify something.
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Submit show &middot; Free
          </button>
        </div>
      </form>
    </div>
  );
}
