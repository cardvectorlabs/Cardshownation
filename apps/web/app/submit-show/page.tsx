import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

  const submitterName = getRequiredString("submitterName");
  const submitterEmail = getRequiredString("submitterEmail");

  if (!submitterName || !submitterEmail) return;

  const payload = {
    showName: getRequiredString("showName"),
    startDate: getRequiredString("startDate"),
    endDate: getRequiredString("endDate"),
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

const inputClass =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-brand-400 focus:outline-none";

export default function SubmitShowPage() {
  return (
    <div className="container-narrow py-6 sm:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Promoter submission
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          List your card show — free
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Reach collectors searching for shows in your city. Takes under a
          minute. No account needed. We review and publish within 24 hours.
        </p>
        <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-brand-600">✓</span>
            Free listing
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-brand-600">✓</span>
            Live within 24 hours
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-brand-600">✓</span>
            No account needed
          </li>
        </ul>
      </div>

      <form action={handleSubmission} className="mt-8 space-y-8">
        <fieldset className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-slate-700">
            Contact
          </legend>
          <div className="mt-2 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="submitterName" className="mb-2 block text-sm font-medium text-slate-700">
                Your name *
              </label>
              <input
                id="submitterName"
                name="submitterName"
                type="text"
                required
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label htmlFor="submitterEmail" className="mb-2 block text-sm font-medium text-slate-700">
                Your email *
              </label>
              <input
                id="submitterEmail"
                name="submitterEmail"
                type="email"
                required
                className={inputClass}
                placeholder="jane@example.com"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-slate-700">
            Show details
          </legend>
          <div className="mt-2 space-y-5">
            <div>
              <label htmlFor="showName" className="mb-2 block text-sm font-medium text-slate-700">
                Show name *
              </label>
              <input
                id="showName"
                name="showName"
                type="text"
                required
                className={inputClass}
                placeholder="Wichita Sports Card Show"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-slate-700">
                  Start date *
                </label>
                <input id="startDate" name="startDate" type="date" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-2 block text-sm font-medium text-slate-700">
                  End date *
                </label>
                <input id="endDate" name="endDate" type="date" required className={inputClass} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="startTimeLabel" className="mb-2 block text-sm font-medium text-slate-700">
                  Start time
                </label>
                <input
                  id="startTimeLabel"
                  name="startTimeLabel"
                  type="text"
                  className={inputClass}
                  placeholder="9:00 AM"
                />
              </div>
              <div>
                <label htmlFor="endTimeLabel" className="mb-2 block text-sm font-medium text-slate-700">
                  End time
                </label>
                <input
                  id="endTimeLabel"
                  name="endTimeLabel"
                  type="text"
                  className={inputClass}
                  placeholder="4:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Categories *
              </label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {SHOW_CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={category}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Tell collectors what to expect, what categories are strongest, and anything important about the event."
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-slate-700">
            Venue
          </legend>
          <div className="mt-2 space-y-5">
            <div>
              <label htmlFor="venueName" className="mb-2 block text-sm font-medium text-slate-700">
                Venue name *
              </label>
              <input
                id="venueName"
                name="venueName"
                type="text"
                required
                className={inputClass}
                placeholder="Convention center, hotel ballroom, civic center"
              />
            </div>

            <div>
              <label htmlFor="venueAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Street address (optional)
              </label>
              <input
                id="venueAddress"
                name="venueAddress"
                type="text"
                className={inputClass}
                placeholder="123 Main St — leave blank if unsure"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="mb-2 block text-sm font-medium text-slate-700">
                  City *
                </label>
                <input id="city" name="city" type="text" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="state" className="mb-2 block text-sm font-medium text-slate-700">
                  State *
                </label>
                <select id="state" name="state" required className={inputClass}>
                  <option value="">Select a state</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="parkingInfo" className="mb-2 block text-sm font-medium text-slate-700">
                Parking info
              </label>
              <input
                id="parkingInfo"
                name="parkingInfo"
                type="text"
                className={inputClass}
                placeholder="Free lot on the north side, paid garage next door, etc."
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-slate-700">
            Vendor info (optional)
          </legend>
          <div className="mt-2 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="tableCount" className="mb-2 block text-sm font-medium text-slate-700">
                  Approximate table count
                </label>
                <input
                  id="tableCount"
                  name="tableCount"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className={inputClass}
                  placeholder="80"
                />
              </div>
              <div>
                <label htmlFor="vendorDetails" className="mb-2 block text-sm font-medium text-slate-700">
                  Vendor info
                </label>
                <input
                  id="vendorDetails"
                  name="vendorDetails"
                  type="text"
                  className={inputClass}
                  placeholder="Dealer tables available, waitlist only, setup starts at 7 AM"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="websiteUrl" className="mb-2 block text-sm font-medium text-slate-700">
                  Website URL
                </label>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label htmlFor="facebookUrl" className="mb-2 block text-sm font-medium text-slate-700">
                  Social or Facebook event URL
                </label>
                <input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  className={inputClass}
                  placeholder="https://facebook.com/events/..."
                />
              </div>
            </div>
          </div>
        </fieldset>

        <details className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700">
            <span>Add admission details (optional)</span>
            <span
              aria-hidden
              className="text-slate-400 transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap gap-5 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isFree"
                  value="free"
                  className="border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Free
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isFree"
                  value="paid"
                  defaultChecked
                  className="border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Paid
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="admissionPrice" className="mb-2 block text-sm font-medium text-slate-700">
                  Admission price
                </label>
                <input
                  id="admissionPrice"
                  name="admissionPrice"
                  type="text"
                  className={inputClass}
                  placeholder="$5 adults, kids 12 and under free"
                />
              </div>
              <div>
                <label htmlFor="admissionNotes" className="mb-2 block text-sm font-medium text-slate-700">
                  Admission notes
                </label>
                <input
                  id="admissionNotes"
                  name="admissionNotes"
                  type="text"
                  className={inputClass}
                  placeholder="Early entry at 8 AM, cash only at door, etc."
                />
              </div>
            </div>
          </div>
        </details>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500">
            Free listing. We review and publish within 24 hours. We&apos;ll
            only email you if we need to clarify something.
          </p>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Submit show · Free
          </button>
        </div>
      </form>
    </div>
  );
}
