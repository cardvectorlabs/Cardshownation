import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Submit a Card Show",
  description:
    "Submit your upcoming card show, sports card event, or TCG tournament to Card Show Nation.",
};

const CATEGORIES = [
  "Sports Cards", "Pokémon", "TCG", "Mixed",
  "Memorabilia", "Comics", "Trade Night", "Autograph Guests",
];

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

async function handleSubmission(formData: FormData) {
  "use server";

  const submitterName = formData.get("submitterName") as string;
  const submitterEmail = formData.get("submitterEmail") as string;

  if (!submitterName || !submitterEmail) return;

  const payload = {
    showName: formData.get("showName"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    city: formData.get("city"),
    state: formData.get("state"),
    venueName: formData.get("venueName"),
    venueAddress: formData.get("venueAddress"),
    categories: formData.getAll("categories"),
    organizerName: formData.get("organizerName"),
    organizerEmail: formData.get("organizerEmail"),
    description: formData.get("description") || null,
    tableCount: formData.get("tableCount") || null,
    websiteUrl: formData.get("websiteUrl") || null,
    facebookUrl: formData.get("facebookUrl") || null,
    isFree: formData.get("isFree") === "free",
    admissionPrice: formData.get("admissionPrice") || null,
    parkingInfo: formData.get("parkingInfo") || null,
  };

  await db.showSubmission.create({
    data: {
      submitterName,
      submitterEmail,
      payloadJson: payload,
      status: "PENDING",
    },
  });

  redirect("/submit-show/thank-you");
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";

export default function SubmitShowPage() {
  return (
    <div className="container-narrow py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Submit a Card Show</h1>
        <p className="mt-2 text-slate-500">
          Listings are reviewed within 24 hours and published when approved.
          Fields marked with * are required.
        </p>
      </div>

      <form action={handleSubmission} className="space-y-8">

        {/* ── Your contact info ── */}
        <fieldset className="rounded-xl border border-slate-200 p-6 space-y-5">
          <legend className="text-sm font-semibold text-slate-700 px-1">
            Your Contact Info
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="submitterName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Name *
              </label>
              <input id="submitterName" name="submitterName" type="text" required
                className={inputClass} placeholder="Jane Smith" />
            </div>
            <div>
              <label htmlFor="submitterEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Email *
              </label>
              <input id="submitterEmail" name="submitterEmail" type="email" required
                className={inputClass} placeholder="jane@example.com" />
            </div>
          </div>
        </fieldset>

        {/* ── Show details ── */}
        <fieldset className="rounded-xl border border-slate-200 p-6 space-y-5">
          <legend className="text-sm font-semibold text-slate-700 px-1">
            Show Details
          </legend>

          <div>
            <label htmlFor="showName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Show Name *
            </label>
            <input id="showName" name="showName" type="text" required
              className={inputClass} placeholder="Dallas Sports Card Show" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Date *
              </label>
              <input id="startDate" name="startDate" type="date" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                End Date *
              </label>
              <input id="endDate" name="endDate" type="date" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categories * (select all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat: any) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                >
                  <input type="checkbox" name="categories" value={cat}
                    className="rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm text-slate-700">{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        {/* ── Venue ── */}
        <fieldset className="rounded-xl border border-slate-200 p-6 space-y-5">
          <legend className="text-sm font-semibold text-slate-700 px-1">Venue</legend>

          <div>
            <label htmlFor="venueName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Venue Name *
            </label>
            <input id="venueName" name="venueName" type="text" required
              className={inputClass} placeholder="Civic Center, Holiday Inn, etc." />
          </div>

          <div>
            <label htmlFor="venueAddress" className="block text-sm font-medium text-slate-700 mb-1.5">
              Street Address *
            </label>
            <input id="venueAddress" name="venueAddress" type="text" required
              className={inputClass} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                City *
              </label>
              <input id="city" name="city" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">
                State *
              </label>
              <select id="state" name="state" required
                className={inputClass + " text-slate-700"}>
                <option value="">Select a state</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ── Organizer ── */}
        <fieldset className="rounded-xl border border-slate-200 p-6 space-y-5">
          <legend className="text-sm font-semibold text-slate-700 px-1">Organizer</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="organizerName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Organizer / Promoter Name *
              </label>
              <input id="organizerName" name="organizerName" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="organizerEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                Organizer Email *
              </label>
              <input id="organizerEmail" name="organizerEmail" type="email" required className={inputClass} />
            </div>
          </div>
        </fieldset>

        {/* ── Optional ── */}
        <fieldset className="rounded-xl border border-slate-200 p-6 space-y-5">
          <legend className="text-sm font-semibold text-slate-700 px-1">
            Optional Details
          </legend>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea id="description" name="description" rows={4}
              className={inputClass + " resize-none"}
              placeholder="Tell collectors what to expect..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="tableCount" className="block text-sm font-medium text-slate-700 mb-1.5">
                Approximate Table Count
              </label>
              <input id="tableCount" name="tableCount" type="number" min="1"
                className={inputClass} placeholder="200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Admission
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="isFree" value="free" className="text-brand-600" />
                  Free
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="isFree" value="paid" defaultChecked className="text-brand-600" />
                  Paid
                </label>
              </div>
              <input
                id="admissionPrice"
                name="admissionPrice"
                type="text"
                className={inputClass + " mt-2"}
                placeholder="e.g. $5 adults, kids free"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-700 mb-1.5">
                Website URL
              </label>
              <input id="websiteUrl" name="websiteUrl" type="url"
                className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label htmlFor="facebookUrl" className="block text-sm font-medium text-slate-700 mb-1.5">
                Facebook Event URL
              </label>
              <input id="facebookUrl" name="facebookUrl" type="url"
                className={inputClass} placeholder="https://facebook.com/events/..." />
            </div>
          </div>

          <div>
            <label htmlFor="parkingInfo" className="block text-sm font-medium text-slate-700 mb-1.5">
              Parking Info
            </label>
            <input id="parkingInfo" name="parkingInfo" type="text"
              className={inputClass} placeholder="Free parking in lot B..." />
          </div>
        </fieldset>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-400">
            Submissions are reviewed before publishing.
          </p>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Submit Show
          </button>
        </div>
      </form>
    </div>
  );
}
