export const APP_TIME_ZONE = "Europe/Paris";

function offsetMinutes(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return (asUtc - date.getTime()) / 60000;
}

/** Parses an <input type="datetime-local"> value ("2026-10-06T19:00") as wall-clock time in `timeZone`. */
export function parseLocalDateTime(value: string, timeZone = APP_TIME_ZONE): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const guess = new Date(`${value}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;
  return new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000);
}
