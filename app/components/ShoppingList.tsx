import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { getWeekRecipeIds } from "../lib/meal-plan";
import { getRecipes } from "../lib/recipes";
import {
  buildShoppingList,
  toggleChecked,
  clearChecked,
  type ShoppingItem,
} from "../lib/shopping";

interface ShoppingListProps {
  weekOffset: number;
}

export function ShoppingList({ weekOffset }: ShoppingListProps) {
  const [, setRefresh] = useState(0);
  const [showChecked, setShowChecked] = useState(false);

  const recipes = getRecipes();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  const plannedRecipeIds = getWeekRecipeIds(weekOffset);
  const plannedRecipes = plannedRecipeIds
    .map((id) => recipeMap.get(id))
    .filter(Boolean) as typeof recipes;

  const items = useMemo(
    () => buildShoppingList(plannedRecipes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plannedRecipeIds.join(",")]
  );

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  function handleToggle(item: ShoppingItem) {
    toggleChecked(item.text);
    setRefresh((n) => n + 1);
  }

  function handleClearAll() {
    clearChecked();
    setRefresh((n) => n + 1);
  }

  if (plannedRecipes.length === 0) {
    return (
      <div className="text-center py-16 card-enter">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-olive-ghost flex items-center justify-center">
          <ShoppingCart className="w-7 h-7 text-olive/30" />
        </div>
        <h3 className="font-display text-lg font-semibold text-bark mb-1">
          No meals planned yet
        </h3>
        <p className="text-bark-muted text-sm max-w-xs mx-auto">
          Go to the Meal Plan tab and add some recipes to your week — then come
          back here to see your shopping list.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto card-enter">
      {/* Summary */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-bark-muted">
            <span className="font-semibold text-bark">{items.length}</span>{" "}
            item{items.length !== 1 ? "s" : ""} from{" "}
            <span className="font-semibold text-bark">
              {plannedRecipes.length}
            </span>{" "}
            recipe{plannedRecipes.length !== 1 ? "s" : ""}
          </p>
        </div>
        {checked.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs font-medium text-bark-muted hover:text-olive transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Uncheck all
          </button>
        )}
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-bark-muted mb-1.5">
            <span>
              {checked.length} of {items.length} done
            </span>
            {checked.length === items.length && (
              <span className="flex items-center gap-1 text-olive font-semibold">
                <Sparkles className="w-3 h-3" />
                All done!
              </span>
            )}
          </div>
          <div className="h-2 bg-parchment/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-olive rounded-full transition-all duration-500"
              style={{
                width: `${(checked.length / items.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Unchecked items */}
      <div className="space-y-1">
        {unchecked.map((item) => (
          <ShoppingItemRow
            key={item.text}
            item={item}
            onToggle={() => handleToggle(item)}
          />
        ))}
      </div>

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setShowChecked(!showChecked)}
            className="flex items-center gap-1.5 text-sm font-medium text-bark-muted hover:text-bark transition-colors mb-2"
          >
            {showChecked ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {checked.length} checked item{checked.length !== 1 ? "s" : ""}
          </button>
          {showChecked && (
            <div className="space-y-1 card-enter">
              {checked.map((item) => (
                <ShoppingItemRow
                  key={item.text}
                  item={item}
                  onToggle={() => handleToggle(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShoppingItemRow({
  item,
  onToggle,
}: {
  item: ShoppingItem;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left group ${
        item.checked
          ? "bg-parchment/30"
          : "bg-white border border-parchment/40 hover:border-olive/20"
      }`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          item.checked
            ? "bg-olive border-olive"
            : "border-bark-faint group-hover:border-olive"
        }`}
      >
        {item.checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium transition-colors ${
            item.checked
              ? "text-bark-muted line-through"
              : "text-bark"
          }`}
        >
          {item.text}
        </p>
        {item.fromRecipes.length > 0 && (
          <p className="text-xs text-bark-faint mt-0.5 truncate">
            {item.fromRecipes.join(", ")}
          </p>
        )}
      </div>
    </button>
  );
}
