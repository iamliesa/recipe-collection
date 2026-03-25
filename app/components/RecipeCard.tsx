import { ChefHat, Trash2, UtensilsCrossed } from "lucide-react";
import type { Recipe } from "../lib/recipes";

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  index: number;
}

export function RecipeCard({
  recipe,
  onSelect,
  onDelete,
  index,
}: RecipeCardProps) {
  return (
    <div
      onClick={() => onSelect(recipe)}
      className="card-enter group cursor-pointer bg-white rounded-2xl overflow-hidden border border-parchment/60 hover:border-olive-light/30 hover:shadow-lg hover:shadow-olive/5 transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {recipe.image ? (
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-olive-pale to-cream-dark flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a5d3a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <UtensilsCrossed className="w-10 h-10 text-olive/20" />
        </div>
      )}

      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-bark leading-snug group-hover:text-olive transition-colors duration-300">
          {recipe.title}
        </h3>

        <div className="flex items-center gap-3 mt-3 text-sm text-bark-muted">
          <span className="flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            {recipe.ingredients.length} ingredients
          </span>
          <span className="w-1 h-1 rounded-full bg-bark-faint" />
          <span>{recipe.steps.length} steps</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {recipe.categories.map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-olive-ghost text-olive border border-olive-pale/60"
            >
              {cat}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-parchment/50">
          <span className="text-xs text-bark-faint italic">
            {recipe.source && `from ${recipe.source}`}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recipe.id);
            }}
            className="p-1.5 rounded-lg text-bark-faint hover:text-terracotta hover:bg-terracotta-pale transition-colors"
            aria-label="Delete recipe"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
