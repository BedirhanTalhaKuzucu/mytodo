import type { TaskRecurrence } from "@/types";

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function getTomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISODate(d);
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function computeNextRecurrenceDate(
  currentDueDate: string | null,
  recurrence: TaskRecurrence
): string | null {
  if (recurrence === "none") return null;
  const base = currentDueDate ? parseISODate(currentDueDate) : new Date();
  if (recurrence === "daily") {
    base.setDate(base.getDate() + 1);
  } else if (recurrence === "weekly") {
    base.setDate(base.getDate() + 7);
  } else if (recurrence === "monthly") {
    base.setMonth(base.getMonth() + 1);
  }
  return toISODate(base);
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate < getTodayISO();
}

export function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate === getTodayISO();
}

export function formatTurkishDateLong(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatTurkishDateShort(iso: string): string {
  const today = getTodayISO();
  const tomorrow = getTomorrowISO();
  if (iso === today) return "Bugün";
  if (iso === tomorrow) return "Yarın";
  const d = parseISODate(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function getWeekDays(weekOffset: number = 0): {
  iso: string;
  dayName: string;
  dayNumber: string;
  monthShort: string;
  isToday: boolean;
}[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);

  const todayISO = getTodayISO();
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISODate(d);
    days.push({
      iso,
      dayName: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(d),
      dayNumber: String(d.getDate()),
      monthShort: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(d),
      isToday: iso === todayISO,
    });
  }

  return days;
}

export function getMonthCalendarDays(monthOffset: number = 0): {
  monthLabel: string;
  days: {
    iso: string;
    dayNumber: string;
    monthShort: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[];
} {
  const now = new Date();
  const firstOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1
  );
  const targetMonth = firstOfMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(firstOfMonth);

  const dayOfWeek = firstOfMonth.getDay(); // 0 = Sun, 1 = Mon
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() + diffToMonday);

  const lastOfMonth = new Date(
    firstOfMonth.getFullYear(),
    targetMonth + 1,
    0
  );
  const totalDaysNeeded =
    Math.ceil((Math.abs(diffToMonday) + lastOfMonth.getDate()) / 7) * 7;

  const todayISO = getTodayISO();
  const days = [];

  for (let i = 0; i < totalDaysNeeded; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toISODate(d);
    days.push({
      iso,
      dayNumber: String(d.getDate()),
      monthShort: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(d),
      isCurrentMonth: d.getMonth() === targetMonth,
      isToday: iso === todayISO,
    });
  }

  return { monthLabel, days };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
