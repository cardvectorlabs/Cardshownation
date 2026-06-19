import { fetchCardShowsFromEventbrite } from "@/lib/eventbrite";
import { ingestImportedShows } from "@/lib/show-import-ingest";

export async function runEventbriteImport() {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) return { error: "EVENTBRITE_API_KEY not set" };

  const shows = await fetchCardShowsFromEventbrite(apiKey);
  return ingestImportedShows({
    source: "eventbrite",
    label: "Eventbrite",
    submitterName: "Eventbrite Import",
    submitterEmail: "import@cardshownation.com",
    shows,
  });
}
