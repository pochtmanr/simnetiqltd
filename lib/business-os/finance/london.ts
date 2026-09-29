const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function londonDate(instant: Date): string {
  const parts = formatter.formatToParts(instant);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("london_date_invalid");
  return `${year}-${month}-${day}`;
}

export function londonTime(instant: Date): string {
  const parts = wallClock.formatToParts(instant);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  if (!hour || !minute) throw new Error("london_time_invalid");
  const normalized = hour === "24" ? "00" : hour;
  return `${normalized}:${minute}`;
}

const wallClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function londonOffsetMs(instant: Date): number {
  const parts = wallClock.formatToParts(instant);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(pick("year"), pick("month") - 1, pick("day"), pick("hour"), pick("minute"), pick("second"));
  return asUtc - instant.getTime();
}

export function londonWallToUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = londonOffsetMs(guess);
  const adjusted = new Date(guess.getTime() - offset);
  const secondOffset = londonOffsetMs(adjusted);
  if (secondOffset !== offset) return new Date(guess.getTime() - secondOffset);
  return adjusted;
}

export function londonWindow(grain: "month" | "year", anchor: Date): { from: string; to: string } {
  const date = londonDate(anchor);
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (grain === "year") {
    return {
      from: londonWallToUtc(year, 1, 1).toISOString(),
      to: londonWallToUtc(year + 1, 1, 1).toISOString(),
    };
  }
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return {
    from: londonWallToUtc(year, month, 1).toISOString(),
    to: londonWallToUtc(next.year, next.month, 1).toISOString(),
  };
}
