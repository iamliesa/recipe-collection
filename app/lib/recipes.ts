export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  image?: string;
  categories: string[];
  source?: string;
  createdAt: string;
}

const STORAGE_KEY = "recipe-collection";

const defaultRecipes: Recipe[] = [
  {
    id: "1",
    title: "Gesunder Nudelauflauf",
    ingredients: [
      "250g Vollkornnudeln",
      "200g Brokkoli",
      "150g Cherrytomaten",
      "100g geriebener Mozzarella",
      "2 Eier",
      "150ml Milch",
      "1 Knoblauchzehe",
      "Salz, Pfeffer, Muskatnuss",
      "Frische Kräuter (Basilikum, Petersilie)",
    ],
    steps: [
      "Ofen auf 200°C vorheizen.",
      "Nudeln nach Packungsanleitung al dente kochen, abgießen.",
      "Brokkoli in kleine Röschen teilen und 3 Minuten blanchieren.",
      "Cherrytomaten halbieren, Knoblauch fein hacken.",
      "Eier mit Milch, Salz, Pfeffer und Muskatnuss verquirlen.",
      "Nudeln, Brokkoli und Tomaten in eine Auflaufform geben.",
      "Eiermischung darüber gießen und mit Mozzarella bestreuen.",
      "25–30 Minuten backen, bis der Käse goldbraun ist.",
      "Mit frischen Kräutern garnieren und servieren.",
    ],
    categories: ["Pasta", "Healthy"],
    source: "Instagram",
    createdAt: "2026-03-20",
  },
  {
    id: "2",
    title: "Tortellini Suppe",
    ingredients: [
      "250g Tortellini (frisch)",
      "1 Dose stückige Tomaten (400g)",
      "500ml Gemüsebrühe",
      "100g frischer Spinat",
      "1 Zwiebel",
      "2 Knoblauchzehen",
      "1 EL Olivenöl",
      "100ml Sahne oder Kokosmilch",
      "1 TL Paprikapulver",
      "Salz, Pfeffer, Italienische Kräuter",
      "Parmesan zum Servieren",
    ],
    steps: [
      "Zwiebel und Knoblauch fein würfeln.",
      "Olivenöl in einem großen Topf erhitzen, Zwiebel und Knoblauch darin anschwitzen.",
      "Stückige Tomaten und Gemüsebrühe dazugeben, mit Paprikapulver, Salz und Pfeffer würzen.",
      "Zum Kochen bringen und Tortellini hineingeben.",
      "5–7 Minuten köcheln lassen, bis die Tortellini gar sind.",
      "Spinat und Sahne unterrühren, kurz erwärmen.",
      "Mit italienischen Kräutern abschmecken.",
      "In Schüsseln servieren und mit Parmesan bestreuen.",
    ],
    categories: ["Soups", "Pasta"],
    source: "Instagram",
    createdAt: "2026-03-18",
  },
];

export const ALL_CATEGORIES = [
  "Pasta",
  "Soups",
  "Salads",
  "Bowls",
  "Snacks",
  "Breakfast",
  "Drinks",
  "Healthy",
  "Quick Meals",
  "Meal Prep",
];

export function getRecipes(): Recipe[] {
  if (typeof window === "undefined") return defaultRecipes;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRecipes));
    return defaultRecipes;
  }
  return JSON.parse(stored);
}

/**
 * Fetch recipes added via the terminal and merge them into localStorage.
 * Call this once when the app starts.
 */
export async function syncFileRecipes(): Promise<boolean> {
  try {
    const res = await fetch("/data/recipes.json");
    if (!res.ok) return false;
    const fileRecipes: Recipe[] = await res.json();
    if (fileRecipes.length === 0) return false;

    const current = getRecipes();
    const currentMap = new Map(current.map((r) => [r.id, r]));
    let changed = false;

    for (const fileRecipe of fileRecipes) {
      const existing = currentMap.get(fileRecipe.id);
      if (!existing) {
        // New recipe — add it
        currentMap.set(fileRecipe.id, fileRecipe);
        changed = true;
      } else if (JSON.stringify(existing) !== JSON.stringify(fileRecipe)) {
        // Existing recipe was updated in the file — update it
        currentMap.set(fileRecipe.id, { ...existing, ...fileRecipe });
        changed = true;
      }
    }

    if (!changed) return false;

    const merged = Array.from(currentMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

export function saveRecipe(recipe: Omit<Recipe, "id" | "createdAt">): Recipe {
  const recipes = getRecipes();
  const newRecipe: Recipe = {
    ...recipe,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split("T")[0],
  };
  recipes.unshift(newRecipe);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  return newRecipe;
}

export function deleteRecipe(id: string): void {
  const recipes = getRecipes().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function updateRecipe(id: string, data: Partial<Recipe>): void {
  const recipes = getRecipes().map((r) =>
    r.id === id ? { ...r, ...data } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}
