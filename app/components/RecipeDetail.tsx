import { ArrowLeft, ChefHat, ListOrdered, UtensilsCrossed } from "lucide-react";
import type { Recipe } from "../lib/recipes";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to recipes
      </button>

      {recipe.image ? (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
          <UtensilsCrossed className="w-20 h-20 text-emerald-200" />
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-3">
        {recipe.title}
      </h1>

      <div className="flex flex-wrap gap-2 mb-8">
        {recipe.categories.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="bg-white rounded-2xl p-6 border border-stone-100">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-800 mb-4">
            <ChefHat className="w-5 h-5 text-emerald-600" />
            Ingredients
          </h2>
          <ul className="space-y-2.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 text-stone-600">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone-100">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-800 mb-4">
            <ListOrdered className="w-5 h-5 text-emerald-600" />
            Steps
          </h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-stone-600">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {recipe.source && (
        <p className="text-sm text-stone-400 mt-8 text-center">
          Source: {recipe.source}
        </p>
      )}
    </div>
  );
}
