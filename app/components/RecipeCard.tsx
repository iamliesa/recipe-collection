import { Clock, ChefHat, Trash2, UtensilsCrossed } from "lucide-react";
import type { Recipe } from "../lib/recipes";

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onSelect, onDelete }: RecipeCardProps) {
  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-stone-100 hover:border-stone-200"
    >
      {recipe.image ? (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
          <UtensilsCrossed className="w-12 h-12 text-emerald-300" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-stone-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            {recipe.ingredients.length} ingredients
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {recipe.steps.length} steps
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {recipe.categories.map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
            >
              {cat}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
          <span className="text-xs text-stone-400">
            {recipe.source && `from ${recipe.source}`}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recipe.id);
            }}
            className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete recipe"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
