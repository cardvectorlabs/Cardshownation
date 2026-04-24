export const MAX_DAILY_SCHEDULE_DAYS = 31;

export function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function listDateRange(startDate: string, endDate: string, maxDays = MAX_DAILY_SCHEDULE_DAYS) {
  if (!isValidDateInput(startDate) || !isValidDateInput(endDate) || endDate < startDate) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const last = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    if (dates.length > maxDays) {
      return [];
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
