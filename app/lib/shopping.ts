import { flatIngredients } from "./recipes";
import type { Recipe } from "./recipes";

export interface ShoppingItem {
  text: string;
  checked: boolean;
  fromRecipes: string[];
}

const STORAGE_KEY = "recipe-shopping-checked";

/**
 * Build a shopping list from a set of recipes.
 * Groups duplicate / similar ingredients and tracks which recipes need them.
 */
export function buildShoppingList(recipes: Recipe[]): ShoppingItem[] {
  const map = new Map<string, { text: string; fromRecipes: string[] }>();

  for (const recipe of recipes) {
    for (const raw of flatIngredients(recipe)) {
      const key = normalizeIngredient(raw);
      const existing = map.get(key);
      if (existing) {
        if (!existing.fromRecipes.includes(recipe.title)) {
          existing.fromRecipes.push(recipe.title);
        }
        // Keep the longer / more detailed version
        if (raw.length > existing.text.length) {
          existing.text = raw;
        }
      } else {
        map.set(key, { text: raw, fromRecipes: [recipe.title] });
      }
    }
  }

  const checked = getCheckedItems();

  return Array.from(map.values()).map((item) => ({
    ...item,
    checked: checked.includes(normalizeIngredient(item.text)),
  }));
}

/**
 * Normalize an ingredient string for grouping.
 * Strips quantities and units so "200g Brokkoli" and "300g Brokkoli" group together.
 */
function normalizeIngredient(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\d.,/½⅓¼¾⅔⅛]+/g, "")
    .replace(
      /\b(g|kg|ml|l|el|tl|tbsp|tsp|cup|cups|oz|lb|prise|prisen|stück|scheibe|scheiben|dose|dosen|bund|etwas|ca|circa)\b/gi,
      ""
    )
    .replace(/[()]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function getCheckedItems(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function toggleChecked(ingredientText: string): void {
  const key = normalizeIngredient(ingredientText);
  const items = getCheckedItems();
  const idx = items.indexOf(key);
  if (idx >= 0) {
    items.splice(idx, 1);
  } else {
    items.push(key);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearChecked(): void {
  localStorage.removeItem(STORAGE_KEY);
}
