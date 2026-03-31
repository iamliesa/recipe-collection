import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  ingredients: string[];
  steps: string[];
}

export async function extractTextFromImage(
  imageSource: string | File,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageSource, "deu+eng", {
    logger: (info) => {
      if (info.status === "recognizing text" && onProgress) {
        onProgress(Math.round(info.progress * 100));
      }
    },
  });

  const text = result.data.text;
  const { ingredients, steps } = parseRecipeText(text);

  return { text, ingredients, steps };
}

function parseRecipeText(text: string): {
  ingredients: string[];
  steps: string[];
} {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const ingredientLines: string[] = [];
  const stepLines: string[] = [];
  let section: "unknown" | "ingredients" | "steps" = "unknown";

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect section headers
    if (
      lower.includes("zutat") ||
      lower.includes("ingredient") ||
      lower.includes("you need") ||
      lower.includes("you'll need") ||
      lower.includes("was du brauchst")
    ) {
      section = "ingredients";
      continue;
    }

    if (
      lower.includes("zubereitung") ||
      lower.includes("anleitung") ||
      lower.includes("schritte") ||
      lower.includes("step") ||
      lower.includes("instruction") ||
      lower.includes("directions") ||
      lower.includes("method") ||
      lower.includes("so geht") ||
      lower.includes("how to")
    ) {
      section = "steps";
      continue;
    }

    const cleaned = line.replace(/^[\d\.\-\•\*\)\]:]+\s*/, "").trim();
    if (!cleaned || cleaned.length < 3) continue;

    if (section === "ingredients") {
      ingredientLines.push(cleaned);
    } else if (section === "steps") {
      stepLines.push(cleaned);
    } else {
      // Heuristic: lines with quantities likely are ingredients
      const looksLikeIngredient =
        /^\d/.test(line) ||
        /\d+\s*(g|kg|ml|l|el|tl|tbsp|tsp|cup|oz|prise|stück|scheibe)/i.test(
          line
        );
      if (looksLikeIngredient) {
        ingredientLines.push(cleaned);
        section = "ingredients";
      }
    }
  }

  return { ingredients: ingredientLines, steps: stepLines };
}
