import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  Leaf,
  SlidersHorizontal,
  CalendarDays,
  BookOpen,
  ShoppingCart,
} from "lucide-react";
import { getRecipes, deleteRecipe, ALL_CATEGORIES, syncFileRecipes, flatIngredients } from "./lib/recipes";
import type { Recipe } from "./lib/recipes";
import { RecipeCard } from "./components/RecipeCard";
import { RecipeDetail } from "./components/RecipeDetail";
import { AddRecipeForm } from "./components/AddRecipeForm";
import { MealPlanner } from "./components/MealPlanner";
import { ShoppingList } from "./components/ShoppingList";

type View = "recipes" | "planner" | "shopping";

export function App() {
  const [view, setView] = useState<View>("recipes");
  const [weekOffset, setWeekOffset] = useState(0);
  const [recipes, setRecipes] = useState<Recipe[]>(() => getRecipes());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const refreshRecipes = useCallback(() => {
    setRecipes(getRecipes());
  }, []);

  // On startup, pick up any recipes added via the terminal
  useEffect(() => {
    const hasNew = syncFileRecipes();
    if (hasNew) refreshRecipes();
  }, [refreshRecipes]);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      search === "" ||
      recipe.title.toLowerCase().includes(search.toLowerCase()) ||
      flatIngredients(recipe).some((i) =>
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
          onEdit={(recipe) => {
            setEditingRecipe(recipe);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-cream/80 backdrop-blur-md border-b border-parchment/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-olive to-olive-light flex items-center justify-center shadow-md shadow-olive/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-bark tracking-tight">
                  My Recipes
                </h1>
                <p className="text-xs text-bark-muted font-medium mt-0.5">
                  {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-olive text-white font-semibold rounded-xl hover:bg-olive-light transition-colors text-sm shadow-md shadow-olive/20 hover:shadow-lg hover:shadow-olive/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Recipe</span>
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mt-4 bg-parchment/40 rounded-xl p-1">
            <button
              onClick={() => setView("recipes")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === "recipes"
                  ? "bg-white text-bark shadow-sm"
                  : "text-bark-muted hover:text-bark"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Recipes
            </button>
            <button
              onClick={() => setView("planner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === "planner"
                  ? "bg-white text-bark shadow-sm"
                  : "text-bark-muted hover:text-bark"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Meal Plan
            </button>
            <button
              onClick={() => setView("shopping")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === "shopping"
                  ? "bg-white text-bark shadow-sm"
                  : "text-bark-muted hover:text-bark"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Shopping
            </button>
          </div>
        </div>
      </header>

      {view === "planner" ? (
        <MealPlanner weekOffset={weekOffset} onWeekChange={setWeekOffset} />
      ) : view === "shopping" ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ShoppingList weekOffset={weekOffset} />
        </div>
      ) : (
        <>
          {/* Search & Filters */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-2">
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-bark-faint" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search recipes or ingredients..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-parchment/60 rounded-xl text-sm text-bark placeholder:text-bark-faint font-body"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                  selectedCategory
                    ? "bg-olive-ghost border-olive/20 text-olive"
                    : "bg-white border-parchment/60 text-bark-muted hover:text-bark hover:border-parchment"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-4 pb-2 card-enter">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    !selectedCategory
                      ? "bg-olive text-white border-olive shadow-sm"
                      : "bg-white text-bark-light border-parchment hover:border-olive/30"
                  }`}
                >
                  All
                </button>
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat ? null : cat
                      )
                    }
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedCategory === cat
                        ? "bg-olive text-white border-olive shadow-sm"
                        : "bg-white text-bark-light border-parchment hover:border-olive/30"
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
              <div className="text-center py-20 card-enter">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-olive-ghost flex items-center justify-center">
                  <Leaf className="w-9 h-9 text-olive/30" />
                </div>
                <h3 className="font-display text-xl font-semibold text-bark mb-2">
                  No recipes found
                </h3>
                <p className="text-bark-muted text-sm mb-8 max-w-xs mx-auto">
                  {search || selectedCategory
                    ? "Try a different search or filter."
                    : "Add your first recipe to get started!"}
                </p>
                {!search && !selectedCategory && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-olive text-white font-semibold rounded-xl hover:bg-olive-light transition-colors text-sm shadow-md shadow-olive/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add Recipe
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSelect={setSelectedRecipe}
                    onDelete={handleDelete}
                    index={index}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Add / Edit Recipe Modal */}
      {(showAddForm || editingRecipe) && (
        <AddRecipeForm
          editRecipe={editingRecipe ?? undefined}
          onClose={() => {
            setShowAddForm(false);
            setEditingRecipe(null);
          }}
          onSaved={() => {
            setShowAddForm(false);
            if (editingRecipe) {
              // Refresh the detail view with updated data
              const updated = getRecipes().find((r) => r.id === editingRecipe.id);
              if (updated) setSelectedRecipe(updated);
              setEditingRecipe(null);
            }
            refreshRecipes();
          }}
        />
      )}
    </div>
  );
}
