/** Saved calendar keys are immutable. Timestamp history belongs to the account zone. */
export function completionDayKey(value: string, timeZone = 'UTC'): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
      ? value
      : null;
  }

  // Older toDateString values already represent a calendar date, not an instant.
  const legacy =
    /^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}) (\d{4})$/.exec(
      value,
    );
  if (legacy) {
    const month =
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(
        legacy[1],
      ) + 1;
    return completionDayKey(
      `${legacy[3]}-${String(month).padStart(2, '0')}-${legacy[2].padStart(2, '0')}`,
    );
  }

  // Do not guess a device timezone for ambiguous, unzoned timestamp strings.
  if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  if (!completionDayKey(value.slice(0, 10))) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)!.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    return timeZone === 'UTC' ? null : completionDayKey(value, 'UTC');
  }
}
