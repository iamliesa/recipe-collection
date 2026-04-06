import { ArrowLeft, ChefHat, ListOrdered, UtensilsCrossed, Pencil } from "lucide-react";
import type { Recipe } from "../lib/recipes";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
}

export function RecipeDetail({ recipe, onBack, onEdit }: RecipeDetailProps) {
  return (
    <div className="max-w-2xl mx-auto modal-enter">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-bark-muted hover:text-olive transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to recipes</span>
        </button>
        <button
          onClick={() => onEdit(recipe)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-parchment/60 rounded-xl text-sm font-medium text-bark-muted hover:text-olive hover:border-olive/20 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {recipe.image ? (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 shadow-lg shadow-bark/10">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-olive-pale to-cream-dark flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a5d3a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <UtensilsCrossed className="w-16 h-16 text-olive/15" />
        </div>
      )}

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-bark leading-tight mb-4">
        {recipe.title}
      </h1>

      <div className="flex flex-wrap gap-2 mb-10">
        {recipe.categories.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1 rounded-full text-sm font-medium bg-olive-ghost text-olive border border-olive-pale/60"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-6 border border-parchment/60 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-bark mb-5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-olive-pale">
              <ChefHat className="w-4 h-4 text-olive" />
            </span>
            Ingredients
          </h2>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 text-bark-light text-[15px]">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-6 border border-parchment/60 shadow-sm">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-bark mb-5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-terracotta-pale">
              <ListOrdered className="w-4 h-4 text-terracotta" />
            </span>
            Steps
          </h2>
          <ol className="space-y-5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-bark-light text-[15px]">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-olive-ghost text-olive text-xs font-bold shrink-0 mt-0.5 border border-olive-pale/60">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {recipe.source && (
        <p className="text-sm text-bark-faint mt-10 text-center italic">
          Source: {recipe.source}
        </p>
      )}
    </div>
  );
}
