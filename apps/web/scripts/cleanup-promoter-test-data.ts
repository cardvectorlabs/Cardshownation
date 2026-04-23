import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(scriptDirectory, "..", ".env.local");
const envContent = readFileSync(envPath, "utf8");

for (const line of envContent.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#")) {
    continue;
  }

  const separatorIndex = line.indexOf("=");
  if (separatorIndex === -1) {
    continue;
  }

  const key = line.slice(0, separatorIndex).trim();
  const rawValue = line.slice(separatorIndex + 1).trim();
  process.env[key] = rawValue.replace(/^"(.*)"$/, "$1");
}

async function main() {
  const { cleanupPromoterTestData } = await import("../lib/promoters");
  const summary = await cleanupPromoterTestData();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
