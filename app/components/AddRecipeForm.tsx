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
  Layers,
} from "lucide-react";
import {
  ALL_CATEGORIES,
  saveRecipe,
  updateRecipe,
  isGrouped,
  flatIngredients,
  flatSteps,
} from "../lib/recipes";
import type { Recipe, IngredientGroup, StepGroup } from "../lib/recipes";
import { importFromUrl } from "../lib/import-url";
import { extractTextFromImage } from "../lib/ocr";

interface Section {
  label: string;
  items: string[];
}

function initSections(
  data: string[] | IngredientGroup[] | StepGroup[] | undefined
): Section[] {
  if (!data || data.length === 0) return [{ label: "", items: [""] }];
  if (typeof data[0] === "string") {
    return [{ label: "", items: data as string[] }];
  }
  return (data as { label: string; items: string[] }[]).map((g) => ({
    label: g.label,
    items: g.items.length > 0 ? [...g.items] : [""],
  }));
}

interface AddRecipeFormProps {
  onClose: () => void;
  onSaved: () => void;
  editRecipe?: Recipe;
}

export function AddRecipeForm({ onClose, onSaved, editRecipe }: AddRecipeFormProps) {
  const isEditing = !!editRecipe;
  const [title, setTitle] = useState(editRecipe?.title ?? "");
  const [servings, setServings] = useState(editRecipe?.servings?.toString() ?? "");
  const [ingSections, setIngSections] = useState<Section[]>(() =>
    initSections(editRecipe?.ingredients)
  );
  const [stepSections, setStepSections] = useState<Section[]>(() =>
    initSections(editRecipe?.steps)
  );
  const [categories, setCategories] = useState<string[]>(editRecipe?.categories ?? []);
  const [source, setSource] = useState(editRecipe?.source ?? "");
  const [image, setImage] = useState<string | undefined>(editRecipe?.image);
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

  // --- Section helpers ---
  function updateSectionLabel(
    setter: typeof setIngSections,
    sections: Section[],
    sIdx: number,
    label: string
  ) {
    const updated = sections.map((s, i) => (i === sIdx ? { ...s, label } : s));
    setter(updated);
  }

  function addItemToSection(
    setter: typeof setIngSections,
    sections: Section[],
    sIdx: number
  ) {
    const updated = sections.map((s, i) =>
      i === sIdx ? { ...s, items: [...s.items, ""] } : s
    );
    setter(updated);
  }

  function removeItemFromSection(
    setter: typeof setIngSections,
    sections: Section[],
    sIdx: number,
    iIdx: number
  ) {
    const updated = sections.map((s, i) =>
      i === sIdx ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s
    );
    setter(updated);
  }

  function updateItemInSection(
    setter: typeof setIngSections,
    sections: Section[],
    sIdx: number,
    iIdx: number,
    value: string
  ) {
    const updated = sections.map((s, i) =>
      i === sIdx
        ? { ...s, items: s.items.map((item, j) => (j === iIdx ? value : item)) }
        : s
    );
    setter(updated);
  }

  function addSection(setter: typeof setIngSections, sections: Section[]) {
    setter([...sections, { label: "", items: [""] }]);
  }

  function removeSection(
    setter: typeof setIngSections,
    sections: Section[],
    sIdx: number
  ) {
    if (sections.length <= 1) return;
    setter(sections.filter((_, i) => i !== sIdx));
  }

  // --- Output helpers ---
  function buildOutput(sections: Section[]): string[] | { label: string; items: string[] }[] {
    const cleaned = sections.map((s) => ({
      label: s.label.trim(),
      items: s.items.filter((i) => i.trim()),
    })).filter((s) => s.items.length > 0);

    // If only one section with no label, output flat
    if (cleaned.length === 1 && !cleaned[0].label) {
      return cleaned[0].items;
    }
    return cleaned;
  }

  // --- Paste/import helpers (populate first section) ---
  function setFlatIngredients(items: string[]) {
    setIngSections([{ label: "", items }]);
  }
  function setFlatSteps(items: string[]) {
    setStepSections([{ label: "", items }]);
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
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function parsePastedText() {
    const lines = pasteText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const ingredientLines: string[] = [];
    const stepLines: string[] = [];
    let inSteps = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (/step|instruction|method|directions|zubereitung|anleitung|schritte/.test(lower)) {
        inSteps = true;
        continue;
      }
      if (!inSteps && /ingredient|zutat/.test(lower)) continue;
      const cleaned = line.replace(/^[\d\.\-\•\*\)]+\s*/, "");
      if (!cleaned) continue;
      (inSteps ? stepLines : ingredientLines).push(cleaned);
    }
    if (ingredientLines.length > 0) setFlatIngredients(ingredientLines);
    if (stepLines.length > 0) setFlatSteps(stepLines);
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
      if (recipe.ingredients.length > 0) setFlatIngredients(recipe.ingredients);
      if (recipe.steps.length > 0) setFlatSteps(recipe.steps);
      if (recipe.image) setImage(recipe.image);
      if (recipe.source) setSource(recipe.source);
      setUrlMode(false);
      setUrlInput("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Something went wrong.");
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
      if (result.ingredients.length > 0) setFlatIngredients(result.ingredients);
      if (result.steps.length > 0) setFlatSteps(result.steps);
      if (result.ingredients.length === 0 && result.steps.length === 0) {
        setOcrError("The text was read, but couldn't be sorted. See extracted text below and adjust manually.");
      }
    } catch {
      setOcrError("Could not read text from this image. Try the paste option instead.");
    } finally {
      setOcrLoading(false);
      if (ocrFileInputRef.current) ocrFileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const outIngredients = buildOutput(ingSections);
    const outSteps = buildOutput(stepSections);
    const flatIng = Array.isArray(outIngredients) && typeof outIngredients[0] === "string"
      ? outIngredients as string[]
      : (outIngredients as { items: string[] }[]).flatMap((g) => g.items);
    if (!title.trim() || flatIng.length === 0) return;

    const data = {
      title: title.trim(),
      ingredients: outIngredients,
      steps: outSteps,
      servings: servings.trim() || undefined,
      categories,
      source: source.trim() || undefined,
      image,
    };

    if (isEditing && editRecipe) {
      updateRecipe(editRecipe.id, data);
    } else {
      saveRecipe(data);
    }
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
            {isEditing ? "Edit Recipe" : "New Recipe"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-parchment/50 transition-colors">
            <X className="w-5 h-5 text-bark-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Import helpers */}
          <div className="bg-olive-ghost rounded-xl p-4 border border-olive-pale/50 space-y-3">
            <p className="text-xs font-semibold text-olive uppercase tracking-wide">Quick import</p>

            {/* URL import */}
            <div>
              <button type="button" onClick={() => { setUrlMode(!urlMode); setPasteMode(false); setOcrMode(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-light transition-colors">
                <Link className="w-4 h-4" />Import from website URL
              </button>
              <p className="text-xs text-bark-muted mt-0.5">Paste a link to a recipe website.</p>
              {urlMode && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="url" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
                      placeholder="https://www.example.com/recipe..." className="flex-1 px-3.5 py-2 bg-white border border-parchment rounded-xl text-sm text-bark placeholder:text-bark-faint font-body" />
                    <button type="button" onClick={handleUrlImport} disabled={urlLoading || !urlInput.trim()}
                      className="px-4 py-2 bg-olive text-white rounded-xl text-sm font-semibold hover:bg-olive-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                    </button>
                  </div>
                  {urlError && <p className="text-xs text-terracotta">{urlError}</p>}
                </div>
              )}
            </div>

            <div className="border-t border-olive-pale/50" />

            {/* Screenshot scan */}
            <div>
              <button type="button" onClick={() => { setOcrMode(!ocrMode); setUrlMode(false); setPasteMode(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-light transition-colors">
                <ScanText className="w-4 h-4" />Scan text from a screenshot
              </button>
              <p className="text-xs text-bark-muted mt-0.5">Upload a screenshot with recipe text.</p>
              {ocrMode && (
                <div className="mt-3 space-y-3">
                  <input ref={ocrFileInputRef} type="file" accept="image/*" onChange={handleOcrUpload} className="hidden" />
                  {ocrLoading ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-olive" />
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs text-bark-muted mb-1">
                          <span>Reading text from image...</span><span>{ocrProgress}%</span>
                        </div>
                        <div className="h-2 bg-parchment rounded-full overflow-hidden">
                          <div className="h-full bg-olive rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => ocrFileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-olive/30 rounded-xl flex flex-col items-center justify-center gap-1.5 text-olive hover:border-olive/50 hover:bg-white/50 transition-all">
                      <ScanText className="w-5 h-5" /><span className="text-sm font-medium">Choose a screenshot</span>
                    </button>
                  )}
                  {ocrError && <p className="text-xs text-terracotta">{ocrError}</p>}
                  {ocrExtractedText && (
                    <details className="text-xs">
                      <summary className="text-bark-muted cursor-pointer hover:text-bark transition-colors font-medium">Show extracted text</summary>
                      <pre className="mt-2 p-3 bg-white rounded-lg border border-parchment text-bark-light whitespace-pre-wrap font-body text-xs max-h-40 overflow-y-auto">{ocrExtractedText}</pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-olive-pale/50" />

            {/* Paste text */}
            <div>
              <button type="button" onClick={() => { setPasteMode(!pasteMode); setUrlMode(false); setOcrMode(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-olive hover:text-olive-light transition-colors">
                <ClipboardPaste className="w-4 h-4" />Paste recipe text to auto-fill
              </button>
              <p className="text-xs text-bark-muted mt-0.5">Copy text from Instagram, a website, or anywhere.</p>
              {pasteMode && (
                <div className="mt-3 space-y-2">
                  <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the full recipe text here..."
                    className="w-full h-36 px-4 py-3 bg-white border border-parchment rounded-xl text-sm text-bark placeholder:text-bark-faint font-body resize-none" />
                  <button type="button" onClick={parsePastedText}
                    className="px-4 py-2 bg-olive text-white rounded-xl text-sm font-semibold hover:bg-olive-light transition-colors">
                    Auto-fill from text
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title + Servings */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-bark mb-1.5">Recipe Name</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gesunder Nudelauflauf" className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-bark mb-1.5">Servings</label>
              <input type="text" value={servings} onChange={(e) => setServings(e.target.value)}
                placeholder="e.g. 4" className={inputClass} />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-1.5">Photo</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {image ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={image} alt="Recipe" className="w-full h-36 object-cover" />
                <button type="button" onClick={() => setImage(undefined)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors shadow-sm">
                  <X className="w-4 h-4 text-bark" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-parchment rounded-xl flex flex-col items-center justify-center gap-2 text-bark-muted hover:border-olive/40 hover:text-olive hover:bg-olive-ghost/50 transition-all">
                <ImagePlus className="w-5 h-5" /><span className="text-sm">Upload a photo or screenshot</span>
              </button>
            )}
          </div>

          {/* Ingredients with sections */}
          <SectionEditor
            label="Ingredients"
            sections={ingSections}
            onChange={setIngSections}
            itemBullet={(i) => (
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
            )}
            inputClass={smallInputClass}
            addItemLabel="Add ingredient"
            itemPlaceholder={(i) => `Ingredient ${i + 1}`}
            sectionPlaceholder="e.g. For the bowl"
          />

          {/* Steps with sections */}
          <SectionEditor
            label="Steps"
            sections={stepSections}
            onChange={setStepSections}
            itemBullet={(i) => (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-olive-ghost text-olive text-xs font-bold border border-olive-pale/60 shrink-0">
                {i + 1}
              </span>
            )}
            inputClass={smallInputClass}
            addItemLabel="Add step"
            itemPlaceholder={(i) => `Step ${i + 1}`}
            sectionPlaceholder="e.g. For the sauce"
          />

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    categories.includes(cat)
                      ? "bg-olive text-white border-olive shadow-sm"
                      : "bg-white text-bark-light border-parchment hover:border-olive/30 hover:bg-olive-ghost"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-semibold text-bark mb-1.5">Where is this recipe from?</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Instagram, Screenshot, Website..." className={inputClass} />
          </div>

          {/* Submit */}
          <button type="submit"
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-olive text-white font-semibold rounded-xl hover:bg-olive-light transition-colors shadow-md shadow-olive/20 hover:shadow-lg hover:shadow-olive/30">
            <Save className="w-5 h-5" />
            {isEditing ? "Update Recipe" : "Save Recipe"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Reusable section editor ---

function SectionEditor({
  label,
  sections,
  onChange,
  itemBullet,
  inputClass,
  addItemLabel,
  itemPlaceholder,
  sectionPlaceholder,
}: {
  label: string;
  sections: Section[];
  onChange: (s: Section[]) => void;
  itemBullet: (index: number) => React.ReactNode;
  inputClass: string;
  addItemLabel: string;
  itemPlaceholder: (index: number) => string;
  sectionPlaceholder: string;
}) {
  const hasMultipleSections = sections.length > 1 || sections[0]?.label;

  function updateLabel(sIdx: number, value: string) {
    onChange(sections.map((s, i) => (i === sIdx ? { ...s, label: value } : s)));
  }

  function addItem(sIdx: number) {
    onChange(sections.map((s, i) => (i === sIdx ? { ...s, items: [...s.items, ""] } : s)));
  }

  function removeItem(sIdx: number, iIdx: number) {
    onChange(sections.map((s, i) => (i === sIdx ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s)));
  }

  function updateItem(sIdx: number, iIdx: number, value: string) {
    onChange(sections.map((s, i) =>
      i === sIdx ? { ...s, items: s.items.map((item, j) => (j === iIdx ? value : item)) } : s
    ));
  }

  function addNewSection() {
    onChange([...sections, { label: "", items: [""] }]);
  }

  function removeSection(sIdx: number) {
    if (sections.length <= 1) return;
    onChange(sections.filter((_, i) => i !== sIdx));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-bark">{label}</label>
      </div>

      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className={hasMultipleSections ? "bg-white/50 rounded-xl p-3 border border-parchment/40" : ""}>
            {/* Section label */}
            {hasMultipleSections && (
              <div className="flex items-center gap-2 mb-2.5">
                <Layers className="w-3.5 h-3.5 text-olive shrink-0" />
                <input
                  type="text"
                  value={section.label}
                  onChange={(e) => updateLabel(sIdx, e.target.value)}
                  placeholder={sectionPlaceholder}
                  className="flex-1 px-3 py-1.5 bg-cream border border-parchment rounded-lg text-sm font-medium text-olive placeholder:text-bark-faint"
                />
                {sections.length > 1 && (
                  <button type="button" onClick={() => removeSection(sIdx)}
                    className="p-1 text-bark-faint hover:text-terracotta transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="flex gap-2 items-center">
                  {itemBullet(iIdx)}
                  <input type="text" value={item}
                    onChange={(e) => updateItem(sIdx, iIdx, e.target.value)}
                    placeholder={itemPlaceholder(iIdx)} className={inputClass} />
                  {section.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(sIdx, iIdx)}
                      className="p-1.5 text-bark-faint hover:text-terracotta transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={() => addItem(sIdx)}
              className="flex items-center gap-1.5 mt-2.5 text-sm font-medium text-olive hover:text-olive-light transition-colors">
              <Plus className="w-4 h-4" />{addItemLabel}
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addNewSection}
        className="flex items-center gap-1.5 mt-3 text-sm font-medium text-bark-muted hover:text-olive transition-colors">
        <Layers className="w-4 h-4" />Add section (e.g. "For the sauce")
      </button>
    </div>
  );
}
