import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Sun,
  Moon,
  UtensilsCrossed,
  CalendarDays,
} from "lucide-react";
import {
  getWeekDates,
  formatDayName,
  formatDayNumber,
  formatMonthYear,
  formatDate,
  isToday,
  getDayPlan,
  setMeal,
} from "../lib/meal-plan";
import { getRecipes } from "../lib/recipes";
import type { Recipe } from "../lib/recipes";
import { RecipePicker } from "./RecipePicker";

export function MealPlanner() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [, setRefresh] = useState(0);
  const [pickerTarget, setPickerTarget] = useState<{
    date: Date;
    meal: "lunch" | "dinner";
  } | null>(null);

  const forceRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  const dates = getWeekDates(weekOffset);
  const recipes = getRecipes();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  function handlePick(recipeId: string) {
    if (!pickerTarget) return;
    setMeal(pickerTarget.date, pickerTarget.meal, recipeId);
    setPickerTarget(null);
    forceRefresh();
  }

  function handleClear(date: Date, meal: "lunch" | "dinner") {
    setMeal(date, meal, null);
    forceRefresh();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 rounded-xl hover:bg-parchment/50 transition-colors text-bark-muted hover:text-bark"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-bark">
            {formatMonthYear(dates)}
          </h2>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-olive font-medium hover:text-olive-light transition-colors mt-0.5"
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 rounded-xl hover:bg-parchment/50 transition-colors text-bark-muted hover:text-bark"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop: horizontal grid */}
      <div className="hidden md:grid md:grid-cols-7 gap-3">
        {dates.map((date) => (
          <DayColumn
            key={formatDate(date)}
            date={date}
            recipeMap={recipeMap}
            onAdd={(meal) => setPickerTarget({ date, meal })}
            onClear={(meal) => handleClear(date, meal)}
          />
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-3">
        {dates.map((date) => (
          <DayRow
            key={formatDate(date)}
            date={date}
            recipeMap={recipeMap}
            onAdd={(meal) => setPickerTarget({ date, meal })}
            onClear={(meal) => handleClear(date, meal)}
          />
        ))}
      </div>

      {/* Recipe Picker Modal */}
      {pickerTarget && (
        <RecipePicker
          onPick={handlePick}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

function DayColumn({
  date,
  recipeMap,
  onAdd,
  onClear,
}: {
  date: Date;
  recipeMap: Map<string, Recipe>;
  onAdd: (meal: "lunch" | "dinner") => void;
  onClear: (meal: "lunch" | "dinner") => void;
}) {
  const plan = getDayPlan(date);
  const today = isToday(date);

  return (
    <div
      className={`rounded-2xl border p-3 transition-colors ${
        today
          ? "bg-olive-ghost border-olive/20 shadow-sm"
          : "bg-white border-parchment/60"
      }`}
    >
      <div className="text-center mb-3">
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${
            today ? "text-olive" : "text-bark-muted"
          }`}
        >
          {formatDayName(date)}
        </p>
        <p
          className={`text-lg font-display font-bold ${
            today ? "text-olive" : "text-bark"
          }`}
        >
          {formatDayNumber(date)}
        </p>
      </div>

      <div className="space-y-2">
        <MealSlotView
          label="Lunch"
          icon={<Sun className="w-3 h-3" />}
          recipe={plan.lunch.recipeId ? recipeMap.get(plan.lunch.recipeId) : undefined}
          onAdd={() => onAdd("lunch")}
          onClear={() => onClear("lunch")}
        />
        <MealSlotView
          label="Dinner"
          icon={<Moon className="w-3 h-3" />}
          recipe={plan.dinner.recipeId ? recipeMap.get(plan.dinner.recipeId) : undefined}
          onAdd={() => onAdd("dinner")}
          onClear={() => onClear("dinner")}
        />
      </div>
    </div>
  );
}

function DayRow({
  date,
  recipeMap,
  onAdd,
  onClear,
}: {
  date: Date;
  recipeMap: Map<string, Recipe>;
  onAdd: (meal: "lunch" | "dinner") => void;
  onClear: (meal: "lunch" | "dinner") => void;
}) {
  const plan = getDayPlan(date);
  const today = isToday(date);

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        today
          ? "bg-olive-ghost border-olive/20 shadow-sm"
          : "bg-white border-parchment/60"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${
            today ? "bg-olive text-white" : "bg-parchment/50 text-bark"
          }`}
        >
          <span className="text-[10px] font-semibold uppercase leading-none">
            {formatDayName(date)}
          </span>
          <span className="text-sm font-display font-bold leading-tight">
            {formatDayNumber(date)}
          </span>
        </div>
        {today && (
          <span className="text-xs font-semibold text-olive">Today</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MealSlotView
          label="Lunch"
          icon={<Sun className="w-3 h-3" />}
          recipe={plan.lunch.recipeId ? recipeMap.get(plan.lunch.recipeId) : undefined}
          onAdd={() => onAdd("lunch")}
          onClear={() => onClear("lunch")}
        />
        <MealSlotView
          label="Dinner"
          icon={<Moon className="w-3 h-3" />}
          recipe={plan.dinner.recipeId ? recipeMap.get(plan.dinner.recipeId) : undefined}
          onAdd={() => onAdd("dinner")}
          onClear={() => onClear("dinner")}
        />
      </div>
    </div>
  );
}

function MealSlotView({
  label,
  icon,
  recipe,
  onAdd,
  onClear,
}: {
  label: string;
  icon: React.ReactNode;
  recipe?: Recipe;
  onAdd: () => void;
  onClear: () => void;
}) {
  if (recipe) {
    return (
      <div className="relative group">
        <div className="rounded-xl overflow-hidden border border-parchment/40 bg-cream">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt=""
              className="w-full h-16 object-cover"
            />
          ) : (
            <div className="w-full h-10 bg-olive-ghost flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-olive/20" />
            </div>
          )}
          <div className="p-2">
            <p className="text-[11px] font-medium text-bark leading-snug line-clamp-2">
              {recipe.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-parchment shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta-pale hover:border-terracotta/30"
        >
          <X className="w-3 h-3 text-bark-muted hover:text-terracotta" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onAdd}
      className="w-full rounded-xl border-2 border-dashed border-parchment/60 hover:border-olive/30 p-3 flex flex-col items-center justify-center gap-1 text-bark-faint hover:text-olive transition-all hover:bg-white/50"
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <Plus className="w-3.5 h-3.5" />
    </button>
  );
}
