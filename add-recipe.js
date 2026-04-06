#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "public", "data", "recipes.json");

const ALL_CATEGORIES = [
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

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

async function main() {
  console.log("\n🍽  Add a new recipe\n");

  // Title
  const title = await ask("Recipe name: ");
  if (!title) {
    console.log("A recipe needs a name. Try again!");
    rl.close();
    return;
  }

  // Ingredients
  console.log('\nIngredients (type each one and press Enter, type "done" when finished):');
  const ingredients = [];
  let i = 1;
  while (true) {
    const ing = await ask(`  ${i}. `);
    if (ing.toLowerCase() === "done" || ing === "") {
      if (ingredients.length === 0) {
        console.log("  Add at least one ingredient.");
        continue;
      }
      break;
    }
    ingredients.push(ing);
    i++;
  }

  // Steps
  console.log('\nSteps (type each one and press Enter, type "done" when finished):');
  const steps = [];
  let s = 1;
  while (true) {
    const step = await ask(`  ${s}. `);
    if (step.toLowerCase() === "done" || step === "") {
      break;
    }
    steps.push(step);
    s++;
  }

  // Categories
  console.log("\nCategories (pick by number, separate with commas):");
  ALL_CATEGORIES.forEach((cat, idx) => {
    console.log(`  ${idx + 1}. ${cat}`);
  });
  const catInput = await ask("Your choices (e.g. 1,3,8): ");
  const categories = catInput
    .split(",")
    .map((n) => parseInt(n.trim()) - 1)
    .filter((n) => n >= 0 && n < ALL_CATEGORIES.length)
    .map((n) => ALL_CATEGORIES[n]);

  // Source
  const source = await ask("\nWhere is this recipe from? (optional): ");

  // Build recipe
  const recipe = {
    id: Date.now().toString(),
    title,
    ingredients,
    steps,
    categories,
    source: source || undefined,
    createdAt: new Date().toISOString().split("T")[0],
  };

  // Save
  let recipes = [];
  try {
    recipes = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    // file doesn't exist or is empty
  }
  recipes.unshift(recipe);
  writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2));

  console.log(`\n✓ "${title}" saved! It will appear in the app automatically.\n`);
  rl.close();
}

main();
