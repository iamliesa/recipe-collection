import { useState } from "react";
import { Search, X, UtensilsCrossed } from "lucide-react";
import { getRecipes } from "../lib/recipes";
import type { Recipe } from "../lib/recipes";

interface RecipePickerProps {
  onPick: (recipeId: string) => void;
  onClose: () => void;
}

export function RecipePicker({ onPick, onClose }: RecipePickerProps) {
  const [search, setSearch] = useState("");
  const recipes = getRecipes();

  const filtered = recipes.filter(
    (r) =>
      search === "" || r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 backdrop-enter bg-bark/30 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 sm:pt-16">
      <div className="modal-enter bg-cream-dark rounded-2xl shadow-2xl shadow-bark/20 w-full max-w-md relative border border-parchment/80">
        <div className="flex items-center justify-between p-5 border-b border-parchment/60">
          <h2 className="font-display text-xl font-bold text-bark">
            Choose a Recipe
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-parchment/50 transition-colors"
          >
            <X className="w-5 h-5 text-bark-muted" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bark-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-parchment/60 rounded-xl text-sm text-bark placeholder:text-bark-faint font-body"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-bark-muted text-center py-8">
                No recipes found.
              </p>
            ) : (
              filtered.map((recipe) => (
                <RecipeOption
                  key={recipe.id}
                  recipe={recipe}
                  onPick={onPick}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecipeOption({
  recipe,
  onPick,
}: {
  recipe: Recipe;
  onPick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(recipe.id)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors text-left group"
    >
      {recipe.image ? (
        <img
          src={recipe.image}
          alt=""
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-olive-ghost flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-olive/30" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-medium text-sm text-bark group-hover:text-olive transition-colors truncate">
          {recipe.title}
        </p>
        <p className="text-xs text-bark-muted mt-0.5">
          {recipe.ingredients.length} ingredients
        </p>
      </div>
    </button>
  );
}
