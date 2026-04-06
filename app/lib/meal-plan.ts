export interface MealSlot {
  recipeId: string | null;
}

export interface DayPlan {
  lunch: MealSlot;
  dinner: MealSlot;
}

export interface WeekPlan {
  [date: string]: DayPlan;
}

const STORAGE_KEY = "recipe-meal-plans";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDates(weekOffset: number = 0): Date[] {
  const now = new Date();
  const monday = getMonday(now);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDayNumber(date: Date): string {
  return date.getDate().toString();
}

export function formatMonthYear(dates: Date[]): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const opts: Intl.DateTimeFormatOptions = { month: "long" };
  if (first.getMonth() === last.getMonth()) {
    return `${first.toLocaleDateString("en-US", opts)} ${first.getFullYear()}`;
  }
  return `${first.toLocaleDateString("en-US", opts)} – ${last.toLocaleDateString("en-US", opts)} ${last.getFullYear()}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function getAllPlans(): WeekPlan {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function savePlans(plans: WeekPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function getDayPlan(date: Date): DayPlan {
  const plans = getAllPlans();
  const key = formatDate(date);
  return plans[key] || { lunch: { recipeId: null }, dinner: { recipeId: null } };
}

export function setMeal(
  date: Date,
  meal: "lunch" | "dinner",
  recipeId: string | null
): void {
  const plans = getAllPlans();
  const key = formatDate(date);
  if (!plans[key]) {
    plans[key] = { lunch: { recipeId: null }, dinner: { recipeId: null } };
  }
  plans[key][meal].recipeId = recipeId;
  savePlans(plans);
}

export function clearDay(date: Date): void {
  const plans = getAllPlans();
  const key = formatDate(date);
  delete plans[key];
  savePlans(plans);
}

/** Collect all unique recipe IDs planned for a given week. */
export function getWeekRecipeIds(weekOffset: number): string[] {
  const dates = getWeekDates(weekOffset);
  const ids = new Set<string>();
  for (const date of dates) {
    const plan = getDayPlan(date);
    if (plan.lunch.recipeId) ids.add(plan.lunch.recipeId);
    if (plan.dinner.recipeId) ids.add(plan.dinner.recipeId);
  }
  return Array.from(ids);
}
