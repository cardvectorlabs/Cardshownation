const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

export function isFixtureMode() {
  if (process.env.CSN_DATA_MODE === "fixture") return true;
  if (!databaseUrl) return true;
  if (databaseUrl.includes("[PASSWORD]") || databaseUrl.includes("[PROJECT]")) {
    return true;
  }

  return false;
}

export function getDataModeLabel() {
  return isFixtureMode() ? "Fixture Mode" : "Live Data";
}
