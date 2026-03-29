export interface CycleSettings {
  workDays: number;
  restDays: number;
  startDate: string;
  startDayType: "work" | "rest";
}

export interface Notification {
  id: string;
  message: string;
  type: "warning" | "info";
  date: string;
}

export interface DayEvent {
  dateKey: string; // "YYYY-MM-DD"
  label: string;
  emoji: string;
  color: string;
}

export type DayType = "work" | "rest" | "today-work" | "today-rest";

export interface DayInfo {
  date: Date;
  type: DayType;
  dayInCycle: number;
  cyclePhase: "work" | "rest";
}

export const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export const MONTHS_RU_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

export const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const EMOJI_OPTIONS = ["🎉", "🎂", "⭐", "🏖️", "💼", "🏥", "✈️", "🎓", "❤️", "🔔", "🏠", "⚡"];
export const COLOR_OPTIONS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

export const DEFAULT_SETTINGS: CycleSettings = {
  workDays: 4,
  restDays: 2,
  startDate: "2026-01-01",
  startDayType: "work",
};

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDayInfo(date: Date, settings: CycleSettings): DayInfo {
  const start = new Date(settings.startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const cycleLen = settings.workDays + settings.restDays;

  const dayInCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen;

  const isRestPhase =
    settings.startDayType === "work"
      ? dayInCycle >= settings.workDays
      : dayInCycle < settings.restDays;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = target.getTime() === today.getTime();

  const cyclePhase: "work" | "rest" = isRestPhase ? "rest" : "work";
  let type: DayType = cyclePhase;
  if (isToday) type = cyclePhase === "work" ? "today-work" : "today-rest";

  return { date, type, dayInCycle, cyclePhase };
}

export function getMonthDays(year: number, month: number, settings: CycleSettings): (DayInfo | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days: (DayInfo | null)[] = [];

  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(getDayInfo(new Date(year, month, d), settings));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function getYearStats(year: number, settings: CycleSettings) {
  let work = 0, rest = 0;
  for (let m = 0; m < 12; m++) {
    const days = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const info = getDayInfo(new Date(year, m, d), settings);
      if (info.cyclePhase === "work") work++;
      else rest++;
    }
  }
  return { work, rest };
}

export function getMonthStats(year: number, month: number, settings: CycleSettings) {
  let work = 0, rest = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const info = getDayInfo(new Date(year, month, d), settings);
    if (info.cyclePhase === "work") work++;
    else rest++;
  }
  return { work, rest };
}

export function getUpcomingRest(settings: CycleSettings): { days: number; date: Date } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 30; i++) {
    const check = new Date(today);
    check.setDate(today.getDate() + i);
    const info = getDayInfo(check, settings);
    if (info.cyclePhase === "rest") {
      return { days: i, date: check };
    }
  }
  return null;
}
