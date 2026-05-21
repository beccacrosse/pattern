function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Last 7 calendar days ending on `end` (inclusive). */
export function weekEndingOn(end: string) {
  const endDate = parseISODate(end);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  return { from: toISODate(startDate), to: end };
}

export function defaultMetricWeekRange(latestMetricDate: string | null) {
  if (latestMetricDate) {
    return weekEndingOn(latestMetricDate);
  }
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from: toISODate(from), to: toISODate(to) };
}
