import { useState, useRef } from "react";
import {
  X,
  Plus,
  Minus,
  ImagePlus,
  ClipboardPaste,
  Save,
  Link,
  Loader2,
  ScanText,
} from "lucide-react";
import { ALL_CATEGORIES, saveRecipe } from "../lib/recipes";
import { importFromUrl } from "../lib/import-url";
import { extractTextFromImage } from "../lib/ocr";

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
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [ocrMode, setOcrMode] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [ocrExtractedText, setOcrExtractedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleUrlImport() {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError("");
    try {
      const recipe = await importFromUrl(urlInput.trim());
      if (recipe.title) setTitle(recipe.title);
      if (recipe.ingredients.length > 0) setIngredients(recipe.ingredients);
      if (recipe.steps.length > 0) setSteps(recipe.steps);
      if (recipe.image) setImage(recipe.image);
      if (recipe.source) setSource(recipe.source);
      setUrlMode(false);
      setUrlInput("");
    } catch (err) {
      setUrlError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try copying the recipe text and using the paste feature instead."
      );
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrProgress(0);
    setOcrError("");
    setOcrExtractedText("");
    try {
      const result = await extractTextFromImage(file, setOcrProgress);
      setOcrExtractedText(result.text);
      if (result.ingredients.length > 0) setIngredients(result.ingredients);
      if (result.steps.length > 0) setSteps(result.steps);
      if (result.ingredients.length === 0 && result.steps.length === 0) {
        setOcrError(
          "The text was read, but the app couldn't clearly separate ingredients from steps. You can review the extracted text below and adjust the fields manually."
        );
      }
    } catch {
      setOcrError(
        "Could not read text from this image. Try a clearer screenshot or use the paste option instead."
      );
    } finally {
      setOcrLoading(false);
      // Reset the file input so the same file can be selected again
      if (ocrFileInputRef.current) ocrFileInputRef.current.value = "";
    }
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

  const inputClass =
    "w-full px-4 py-2.5 bg-cream border border-parchment rounded-xl text-bark placeholder:text-bark-faint font-body text-[15px]";
  const smallInputClass =
    "flex-1 px-3.5 py-2 bg-cream border border-parchment rounded-xl text-bark placeholder:text-bark-faint font-body text-sm";

  return (
    <div className="fixed inset-0 backdrop-enter bg-bark/30 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 sm:pt-12">
      <div className="modal-enter bg-cream-dark rounded-2xl shadow-2xl shadow-bark/20 w-full max-w-lg relative border border-parchment/80">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-parchment/60">
          <h2 className="font-display text-2xl font-bold text-bark">
            New Recipe
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-parchment/50 transition-colors"
          >
            <X className="w-5 h-5 text-bark-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Import helpers */}
          <div className="bg-olive-ghost rounded-xl p-4 border border-olive-pale/50 space-y-3">
            <p className="text-xs font-semibold text-olive uppercase tracking-wide">
              Quick import
            </p>

            {/* URL import */}
            <div>
              <button
                type="button"
                onClick={() => { setUrlMode(!urlMode); setPasteMode(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-light transition-colors"
              >
                <Link className="w-4 h-4" />
                Import from website URL
              </button>
              <p className="text-xs text-bark-muted mt-0.5">
                Paste a link to a recipe website — the app will try to grab the title,
                ingredients, and steps automatically.
              </p>
              {urlMode && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
                      placeholder="https://www.example.com/recipe..."
                      className="flex-1 px-3.5 py-2 bg-white border border-parchment rounded-xl text-sm text-bark placeholder:text-bark-faint font-body"
                    />
                    <button
                      type="button"
                      onClick={handleUrlImport}
                      disabled={urlLoading || !urlInput.trim()}
                      className="px-4 py-2 bg-olive text-white rounded-xl text-sm font-semibold hover:bg-olive-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {urlLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Import"
                      )}
                    </button>
                  </div>
                  {urlError && (
                    <p className="text-xs text-terracotta">{urlError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-olive-pale/50" />

            {/* Screenshot scan */}
            <div>
              <button
                type="button"
                onClick={() => { setOcrMode(!ocrMode); setUrlMode(false); setPasteMode(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-light transition-colors"
              >
                <ScanText className="w-4 h-4" />
                Scan text from a screenshot
              </button>
              <p className="text-xs text-bark-muted mt-0.5">
                Upload a screenshot that contains recipe text — the app will
                read the text and fill in ingredients and steps.
              </p>
              {ocrMode && (
                <div className="mt-3 space-y-3">
                  <input
                    ref={ocrFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleOcrUpload}
                    className="hidden"
                  />
                  {ocrLoading ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-olive" />
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs text-bark-muted mb-1">
                          <span>Reading text from image...</span>
                          <span>{ocrProgress}%</span>
                        </div>
                        <div className="h-2 bg-parchment rounded-full overflow-hidden">
                          <div
                            className="h-full bg-olive rounded-full transition-all duration-300"
                            style={{ width: `${ocrProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => ocrFileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-olive/30 rounded-xl flex flex-col items-center justify-center gap-1.5 text-olive hover:border-olive/50 hover:bg-white/50 transition-all"
                    >
                      <ScanText className="w-5 h-5" />
                      <span className="text-sm font-medium">Choose a screenshot</span>
                    </button>
                  )}
                  {ocrError && (
                    <p className="text-xs text-terracotta">{ocrError}</p>
                  )}
                  {ocrExtractedText && (
                    <details className="text-xs">
                      <summary className="text-bark-muted cursor-pointer hover:text-bark transition-colors font-medium">
                        Show extracted text
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded-lg border border-parchment text-bark-light whitespace-pre-wrap font-body text-xs max-h-40 overflow-y-auto">
                        {ocrExtractedText}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-olive-pale/50" />

            {/* Paste text */}
            <div>
              <button
                type="button"
                onClick={() => { setPasteMode(!pasteMode); setUrlMode(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-light transition-colors"
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste recipe text to auto-fill
              </button>
              <p className="text-xs text-bark-muted mt-0.5">
                Copy text from Instagram, a website, or anywhere — the app will
                try to sort it into ingredients and steps.
              </p>
              {pasteMode && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the full recipe text here..."
                    className="w-full h-36 px-4 py-3 bg-white border border-parchment rounded-xl text-sm text-bark placeholder:text-bark-faint font-body resize-none"
                  />
                  <button
                    type="button"
                    onClick={parsePastedText}
                    className="px-4 py-2 bg-olive text-white rounded-xl text-sm font-semibold hover:bg-olive-light transition-colors"
                  >
                    Auto-fill from text
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-1.5">
              Recipe Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gesunder Nudelauflauf"
              className={inputClass}
              required
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-1.5">
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
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={image}
                  alt="Recipe"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors shadow-sm"
                >
                  <X className="w-4 h-4 text-bark" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-parchment rounded-xl flex flex-col items-center justify-center gap-2 text-bark-muted hover:border-olive/40 hover:text-olive hover:bg-olive-ghost/50 transition-all"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-sm">Upload a photo or screenshot</span>
              </button>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-2">
              Ingredients
            </label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
                  <input
                    type="text"
                    value={ing}
                    onChange={(e) => updateIngredient(i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`}
                    className={smallInputClass}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="p-1.5 text-bark-faint hover:text-terracotta transition-colors"
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
              className="flex items-center gap-1.5 mt-2.5 text-sm font-medium text-olive hover:text-olive-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add ingredient
            </button>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-2">
              Steps
            </label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-olive-ghost text-olive text-xs font-bold border border-olive-pale/60 shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    className={smallInputClass}
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="p-1.5 text-bark-faint hover:text-terracotta transition-colors"
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
              className="flex items-center gap-1.5 mt-2.5 text-sm font-medium text-olive hover:text-olive-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add step
            </button>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    categories.includes(cat)
                      ? "bg-olive text-white border-olive shadow-sm"
                      : "bg-white text-bark-light border-parchment hover:border-olive/30 hover:bg-olive-ghost"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-1.5">
              Where is this recipe from?
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Instagram, Screenshot, Website..."
              className={inputClass}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-olive text-white font-semibold rounded-xl hover:bg-olive-light transition-colors shadow-md shadow-olive/20 hover:shadow-lg hover:shadow-olive/30"
          >
            <Save className="w-5 h-5" />
            Save Recipe
          </button>
        </form>
      </div>
    </div>
  );
}
