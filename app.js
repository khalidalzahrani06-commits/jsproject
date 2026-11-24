const API = "https://www.themealdb.com/api/json/v1/1";

const COUNTRIES = [
  "Algerian", "Argentina", "Australian", "British", "Canadian", "Chinese",
  "Croatian", "Egyptian", "Filipino", "France", "Greek", "India", "Irish",
  "Italian", "Jamaican", "Japanese", "Kenyan", "Malaysian", "Mexican",
  "Moroccan", "Netherlands", "Norway", "Polish", "Portuguese", "Russian",
  "Saudi Arabian", "Slovakia", "Spanish", "Syrian", "Thai", "Tunisian",
  "Turkish", "Ukrainian", "United States", "Uruguayan", "Venezuela",
  "Vietnamese",
];

const input = document.getElementById("country");
const button = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const results = document.getElementById("results");
const dialog = document.getElementById("recipe");
const recipeBody = document.getElementById("recipe-body");

let requestId = 0; // ignores stale responses if the user searches again quickly

// Fill the dropdown suggestions
const list = document.getElementById("country-list");
COUNTRIES.forEach((name) => {
  const option = document.createElement("option");
  option.value = name;
  list.appendChild(option);
});

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

async function searchMeals() {
  const country = input.value.trim();

  if (!country) {
    results.replaceChildren();
    setStatus("Enter a country name to search.", true);
    return; // no API call
  }

  const thisRequest = ++requestId;
  results.replaceChildren();
  setStatus("Loading...");
  button.disabled = true;

  try {
    const res = await fetch(`${API}/filter.php?a=${encodeURIComponent(country)}`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    if (thisRequest !== requestId) return;

    if (!data.meals) {
      setStatus("No meals found");
      return;
    }

    setStatus(`${data.meals.length} meals for ${country}`);
    renderCards(data.meals);
  } catch (err) {
    if (thisRequest !== requestId) return;
    setStatus("Something went wrong. Check your connection and try again.", true);
    console.error(err);
  } finally {
    if (thisRequest === requestId) button.disabled = false;
  }
}

function renderCards(meals) {
  const frag = document.createDocumentFragment();
  meals.forEach((meal) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";

    const img = document.createElement("img");
    img.src = meal.strMealThumb;
    img.alt = meal.strMeal;
    img.loading = "lazy";

    const title = document.createElement("h2");
    title.textContent = meal.strMeal;

    card.append(img, title);
    card.addEventListener("click", () => openRecipe(meal.idMeal));
    frag.appendChild(card);
  });
  results.replaceChildren(frag);
}

async function openRecipe(id) {
  recipeBody.replaceChildren(document.createTextNode("Loading..."));
  dialog.showModal();

  try {
    const res = await fetch(`${API}/lookup.php?i=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    const meal = data.meals && data.meals[0];
    if (!meal) {
      recipeBody.textContent = "Recipe not found.";
      return;
    }
    renderRecipe(meal);
  } catch (err) {
    recipeBody.textContent = "Couldn't load this recipe. Close and try again.";
    console.error(err);
  }
}

function renderRecipe(meal) {
  const frag = document.createDocumentFragment();

  const img = document.createElement("img");
  img.src = meal.strMealThumb;
  img.alt = meal.strMeal;

  const h2 = document.createElement("h2");
  h2.textContent = meal.strMeal;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = [meal.strArea, meal.strCategory].filter(Boolean).join(", ");

  const ingHeading = document.createElement("h3");
  ingHeading.textContent = "Ingredients";
  const ul = document.createElement("ul");
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || "").trim();
    const measure = (meal[`strMeasure${i}`] || "").trim();
    if (!ing) continue;
    const li = document.createElement("li");
    li.textContent = `${measure} ${ing}`.trim();
    ul.appendChild(li);
  }

  const stepsHeading = document.createElement("h3");
  stepsHeading.textContent = "Instructions";
  const steps = document.createElement("p");
  steps.className = "steps";
  steps.textContent = meal.strInstructions || "";

  frag.append(img, h2, meta, ingHeading, ul, stepsHeading, steps);

  if (meal.strYoutube) {
    const link = document.createElement("a");
    link.href = meal.strYoutube;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Watch on YouTube";
    frag.appendChild(link);
  }

  recipeBody.replaceChildren(frag);
}

button.addEventListener("click", searchMeals);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchMeals();
});

// Click on the backdrop closes the recipe
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});
