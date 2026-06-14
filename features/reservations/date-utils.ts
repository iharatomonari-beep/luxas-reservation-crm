const dayFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short"
});

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;
const timeInputPattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export function addDays(dateValue: string, amount: number) {
  const normalizedDate = normalizeDateInputValue(dateValue);
  if (!normalizedDate) {
    return toDateInputValue(new Date());
  }

  const date = new Date(`${normalizedDate}T00:00:00`);
  date.setDate(date.getDate() + amount);

  return toDateInputValue(date);
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dateValue: string) {
  const normalizedDate = normalizeDateInputValue(dateValue);

  if (!normalizedDate) {
    return dateValue;
  }

  return dayFormatter.format(new Date(`${normalizedDate}T00:00:00`));
}

export function buildTimeSlots(startTime: string, endTime: string, intervalMinutes: number) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const slots: string[] = [];

  if (!Number.isFinite(start) || !Number.isFinite(end) || intervalMinutes <= 0) {
    return slots;
  }

  for (let minutes = start; minutes < end; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

export function timeToMinutes(value: string) {
  const normalizedTime = normalizeTimeInputValue(value);

  if (!normalizedTime) {
    return Number.NaN;
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);

  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeDateInputValue(value: string) {
  const trimmedValue = value.trim();

  if (!dateInputPattern.test(trimmedValue)) {
    return null;
  }

  const date = new Date(`${trimmedValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return toDateInputValue(date) === trimmedValue ? trimmedValue : null;
}

export function normalizeTimeInputValue(value: string) {
  const match = value.trim().match(timeInputPattern);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds !== 0
  ) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
