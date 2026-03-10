export const AUTOMATION_SCHEDULES = ["daily", "weekly", "monthly"] as const;
export type AutomationSchedule = (typeof AUTOMATION_SCHEDULES)[number];

export const DEFAULT_AUTOMATION_SCHEDULE_TIME = "09:00";
export const DEFAULT_AUTOMATION_TIMEZONE = "UTC";
export const AUTOMATION_LOCK_TIMEOUT_MS = 10 * 60 * 1000;
export const AUTOMATION_MAX_RETRIES = 3;

const TRANSIENT_ERROR_PATTERNS = [
  /\b429\b/,
  /\b5\d{2}\b/,
  /timed?\s*out/i,
  /timeout/i,
  /network/i,
  /econnreset/i,
  /socket hang up/i,
  /temporar/i,
  /rate limit/i,
  /fetch failed/i,
  /upstream/i,
] as const;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function normalizeAutomationSchedule(
  value?: string | null
): AutomationSchedule {
  return AUTOMATION_SCHEDULES.includes(value as AutomationSchedule)
    ? (value as AutomationSchedule)
    : "weekly";
}

export function normalizeAutomationScheduleTime(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    return trimmed;
  }
  return DEFAULT_AUTOMATION_SCHEDULE_TIME;
}

export function normalizeAutomationTimezone(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_AUTOMATION_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
    return trimmed;
  } catch {
    return DEFAULT_AUTOMATION_TIMEZONE;
  }
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour"),
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

function toUtcDate(parts: ZonedParts) {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0
    )
  );
}

function addCalendarDays(parts: ZonedParts, days: number): ZonedParts {
  const shifted = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day + days,
      parts.hour,
      parts.minute,
      parts.second,
      0
    )
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

function addCalendarMonths(parts: ZonedParts, months: number): ZonedParts {
  const nextMonthIndex = parts.month - 1 + months;
  const year = parts.year + Math.floor(nextMonthIndex / 12);
  const month = ((nextMonthIndex % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return {
    year,
    month: month + 1,
    day: Math.min(parts.day, lastDayOfMonth),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function zonedDateTimeToUtc(parts: ZonedParts, timeZone: string) {
  let guess = toUtcDate(parts);

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedParts(guess, timeZone);
    const desiredMillis = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0
    );
    const actualMillis = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
      0
    );
    const diff = desiredMillis - actualMillis;
    if (diff === 0) {
      return guess;
    }
    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

export function computeNextRun(
  schedule: string,
  options?: {
    from?: Date;
    timeOfDay?: string | null;
    timeZone?: string | null;
  }
) {
  const normalizedSchedule = normalizeAutomationSchedule(schedule);
  const timeZone = normalizeAutomationTimezone(options?.timeZone);
  const timeOfDay = normalizeAutomationScheduleTime(options?.timeOfDay);
  const [hourText, minuteText] = timeOfDay.split(":");
  const from = options?.from ?? new Date();
  const currentParts = getZonedParts(from, timeZone);
  let nextParts: ZonedParts = {
    ...currentParts,
    hour: Number(hourText),
    minute: Number(minuteText),
    second: 0,
  };

  if (normalizedSchedule === "daily") {
    nextParts = addCalendarDays(nextParts, 1);
  } else if (normalizedSchedule === "weekly") {
    nextParts = addCalendarDays(nextParts, 7);
  } else {
    nextParts = addCalendarMonths(nextParts, 1);
  }

  return zonedDateTimeToUtc(nextParts, timeZone);
}

export function getAutomationRetryDelayMs(retryCount: number) {
  const boundedRetryCount = Math.max(0, retryCount);
  return Math.min(60, 5 * 2 ** boundedRetryCount) * 60 * 1000;
}

export function isTransientAutomationError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}
