export interface ImportedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  image?: string;
  source: string;
}

export async function importFromUrl(url: string): Promise<ImportedRecipe> {
  // Fetch the page HTML through a CORS proxy
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error("Could not fetch the page. The website might be blocking access.");
  }

  const html = await response.text();

  // Try to find JSON-LD structured data (most recipe websites use this)
  const recipeData = extractJsonLdRecipe(html);
  if (recipeData) {
    return { ...recipeData, source: new URL(url).hostname.replace("www.", "") };
  }

  // Fallback: try to extract from meta tags and visible text
  const metaData = extractFromMeta(html);
  if (metaData) {
    return { ...metaData, source: new URL(url).hostname.replace("www.", "") };
  }

  throw new Error(
    "Could not find recipe data on this page. Try copying the recipe text and using the paste feature instead."
  );
}

function extractJsonLdRecipe(html: string): Omit<ImportedRecipe, "source"> | null {
  // Find all JSON-LD script blocks
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const recipe = findRecipeInJsonLd(data);
      if (recipe) return recipe;
    } catch {
      // Skip invalid JSON
    }
  }

  return null;
}

function findRecipeInJsonLd(data: unknown): Omit<ImportedRecipe, "source"> | null {
  if (!data || typeof data !== "object") return null;

  // Handle arrays (some sites wrap in an array)
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findRecipeInJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Check if this object is a Recipe
  const type = obj["@type"];
  const isRecipe =
    type === "Recipe" ||
    (Array.isArray(type) && type.includes("Recipe"));

  if (isRecipe) {
    return parseRecipeObject(obj);
  }

  // Check @graph (some sites nest recipes in a graph)
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const result = findRecipeInJsonLd(item);
      if (result) return result;
    }
  }

  return null;
}

function parseRecipeObject(obj: Record<string, unknown>): Omit<ImportedRecipe, "source"> {
  const title = (obj.name as string) || "Untitled Recipe";

  // Parse ingredients
  const rawIngredients = obj.recipeIngredient as string[] | undefined;
  const ingredients = rawIngredients
    ? rawIngredients.map((i) => stripHtml(i).trim()).filter(Boolean)
    : [];

  // Parse steps — can be strings or objects with "text" property
  const rawInstructions = obj.recipeInstructions;
  const steps = parseInstructions(rawInstructions);

  // Get image
  let image: string | undefined;
  if (typeof obj.image === "string") {
    image = obj.image;
  } else if (Array.isArray(obj.image) && typeof obj.image[0] === "string") {
    image = obj.image[0];
  } else if (obj.image && typeof obj.image === "object") {
    const imgObj = obj.image as Record<string, unknown>;
    image = (imgObj.url as string) || undefined;
  }

  return { title, ingredients, steps, image };
}

function parseInstructions(raw: unknown): string[] {
  if (!raw) return [];

  // Simple string
  if (typeof raw === "string") {
    return raw
      .split(/\n+/)
      .map((s) => stripHtml(s).trim())
      .filter(Boolean);
  }

  // Array of strings or objects
  if (Array.isArray(raw)) {
    const result: string[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        result.push(stripHtml(item).trim());
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        // HowToStep
        if (obj.text) {
          result.push(stripHtml(obj.text as string).trim());
        }
        // HowToSection with itemListElement
        if (Array.isArray(obj.itemListElement)) {
          for (const subItem of obj.itemListElement) {
            if (typeof subItem === "string") {
              result.push(stripHtml(subItem).trim());
            } else if (subItem && typeof subItem === "object") {
              const sub = subItem as Record<string, unknown>;
              if (sub.text) result.push(stripHtml(sub.text as string).trim());
            }
          }
        }
      }
    }
    return result.filter(Boolean);
  }

  return [];
}

function extractFromMeta(html: string): Omit<ImportedRecipe, "source"> | null {
  const titleMatch =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<title>([^<]*)<\/title>/i);

  if (!titleMatch) return null;

  const title = stripHtml(titleMatch[1]).trim();
  if (!title) return null;

  let image: string | undefined;
  const imageMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
  );
  if (imageMatch) image = imageMatch[1];

  // Can't reliably extract ingredients from unstructured HTML
  return {
    title,
    ingredients: [],
    steps: [],
    image,
  };
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
}
