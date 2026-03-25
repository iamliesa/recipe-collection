import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Search, Plus, Leaf, SlidersHorizontal } from "lucide-react";
import { getRecipes, deleteRecipe, ALL_CATEGORIES } from "../lib/recipes";
import type { Recipe } from "../lib/recipes";
import { RecipeCard } from "../components/RecipeCard";
import { RecipeDetail } from "../components/RecipeDetail";
import { AddRecipeForm } from "../components/AddRecipeForm";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => getRecipes());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const refreshRecipes = useCallback(() => {
    setRecipes(getRecipes());
  }, []);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      search === "" ||
      recipe.title.toLowerCase().includes(search.toLowerCase()) ||
      recipe.ingredients.some((i) =>
        i.toLowerCase().includes(search.toLowerCase())
      );
    const matchesCategory =
      !selectedCategory || recipe.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  function handleDelete(id: string) {
    deleteRecipe(id);
    refreshRecipes();
  }

  if (selectedRecipe) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-800">
                  My Recipes
                </h1>
                <p className="text-xs text-stone-400">
                  {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Recipe</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes or ingredients..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              selectedCategory
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-semibold text-stone-600 mb-1">
              No recipes found
            </h3>
            <p className="text-stone-400 text-sm mb-6">
              {search || selectedCategory
                ? "Try a different search or filter."
                : "Add your first recipe to get started!"}
            </p>
            {!search && !selectedCategory && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={setSelectedRecipe}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Recipe Modal */}
      {showAddForm && (
        <AddRecipeForm
          onClose={() => setShowAddForm(false)}
          onSaved={() => {
            setShowAddForm(false);
            refreshRecipes();
          }}
        />
      )}
    </div>
  );
}
