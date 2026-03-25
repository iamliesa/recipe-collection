import { useState, useRef } from "react";
import {
  X,
  Plus,
  Minus,
  ImagePlus,
  ClipboardPaste,
  Save,
} from "lucide-react";
import { ALL_CATEGORIES, saveRecipe } from "../lib/recipes";

interface AddRecipeFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export function AddRecipeForm({ onClose, onSaved }: AddRecipeFormProps) {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [categories, setCategories] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addIngredient() {
    setIngredients([...ingredients, ""]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, value: string) {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  }

  function addStep() {
    setSteps([...steps, ""]);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, value: string) {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  }

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function parsePastedText() {
    const lines = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const ingredientLines: string[] = [];
    const stepLines: string[] = [];
    let inSteps = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.includes("step") ||
        lower.includes("instruction") ||
        lower.includes("method") ||
        lower.includes("directions") ||
        lower.includes("zubereitung") ||
        lower.includes("anleitung") ||
        lower.includes("schritte")
      ) {
        inSteps = true;
        continue;
      }
      if (
        !inSteps &&
        (lower.includes("ingredient") || lower.includes("zutat"))
      ) {
        continue;
      }

      const cleaned = line.replace(/^[\d\.\-\•\*\)]+\s*/, "");
      if (!cleaned) continue;

      if (inSteps) {
        stepLines.push(cleaned);
      } else {
        ingredientLines.push(cleaned);
      }
    }

    if (ingredientLines.length > 0) setIngredients(ingredientLines);
    if (stepLines.length > 0) setSteps(stepLines);
    setPasteMode(false);
    setPasteText("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanIngredients = ingredients.filter((i) => i.trim());
    const cleanSteps = steps.filter((s) => s.trim());
    if (!title.trim() || cleanIngredients.length === 0) return;

    saveRecipe({
      title: title.trim(),
      ingredients: cleanIngredients,
      steps: cleanSteps,
      categories,
      source: source.trim() || undefined,
      image,
    });
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 sm:pt-16">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">Add New Recipe</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Paste helper */}
          <div>
            <button
              type="button"
              onClick={() => setPasteMode(!pasteMode)}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste recipe text to auto-fill
            </button>
            {pasteMode && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste the full recipe text here (from Instagram, a website, etc.). The app will try to separate ingredients from steps for you."
                  className="w-full h-40 px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
                <button
                  type="button"
                  onClick={parsePastedText}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                >
                  Auto-fill from text
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Recipe Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gesunder Nudelauflauf"
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {image ? (
              <div className="relative">
                <img
                  src={image}
                  alt="Recipe"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">Upload a photo or screenshot</span>
              </button>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Ingredients
            </label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={ing}
                    onChange={(e) => updateIngredient(i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`}
                    className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-1.5 mt-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add ingredient
            </button>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Steps
            </label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex items-center justify-center w-7 h-9 text-xs font-semibold text-emerald-600">
                    {i + 1}.
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 mt-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add step
            </button>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categories.includes(cat)
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Where is this recipe from?
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Instagram, Screenshot, Website..."
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Recipe
          </button>
        </form>
      </div>
    </div>
  );
}
