"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ClockIcon,
  UserIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import Link from "next/link";
import Card from "@/components/Card";
import SearchInput from "@/components/SearchInput";
import EmptyRecipesState from "@/components/EmptyRecipesState";
import { useUI } from "@/components/UIContext";
import SwipeableSheet from "@/components/SwipeableSheet";
import { styles } from "@/lib/styles";
import clsx from "clsx";

export default function Home() {
  const [recipes, setRecipes] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");
  const router = useRouter();
  const { setHighlightCreate } = useUI();
  const [generating, setGenerating] = useState(false);

  const [isIngredientSheetOpen, setIsIngredientSheetOpen] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");

  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");

  const [showText, setShowText] = useState(true);

  useEffect(() => {
    if (generating) {
      setShowText(false);
    } else {
      const timer = setTimeout(() => {
        setShowText(true);
      }, 300); // gelijk aan je transition duration
      return () => clearTimeout(timer);
    }
  }, [generating]);

  const handleGenerate = async () => {
    console.log("HANDLE GENERATE START");

    if (!ingredientInput.trim()) {
      console.log("GEEN INGREDIENTEN");
      return;
    }

    try {
      setGenerating(true);

      const ingredientArray = ingredientInput
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredientArray,
          servings: selectedServings,
          category: selectedCategory,
        }),
      });

      const text = await res.text();
      console.log("RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON PARSE ERROR");
        return;
      }

      console.log("API RESPONSE:", data);

      if (!data.error) {
        console.log("GA NAAR PREVIEW");
        localStorage.setItem("ai_preview", JSON.stringify(data));
        router.push("/recipe/preview");
      } else {
        console.log("DATA ERROR");
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  // useEffect(() => {
  //   if (!generating) {
  //     setDotCount(0);
  //     return;
  //   }

  //   const interval = setInterval(() => {
  //     setDotCount((prev) => (prev + 1) % 4);
  //   }, 400);

  //   return () => clearInterval(interval);
  // }, [generating]);

  // 🔥 Fetch recepten
  useEffect(() => {
    const fetchRecipes = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      setRecipes(data || []);
    };

    fetchRecipes();
  }, []);

  const categories = ["Alles", "Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const getCount = (cat: string) => {
    if (!recipes) return 0;
    if (cat === "Alles") return recipes.length;

    return recipes.filter(
      (recipe) => recipe.category?.toLowerCase() === cat.toLowerCase(),
    ).length;
  };

  const filteredRecipes =
    recipes?.filter((recipe) => {
      const matchesSearch = recipe.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "Alles" ||
        recipe.category?.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    }) ?? [];

  // 🔥 Highlight alleen als fetch klaar is en echt leeg
  useEffect(() => {
    if (recipes !== null && filteredRecipes.length === 0) {
      setHighlightCreate(true);

      const timer = setTimeout(() => {
        setHighlightCreate(false);
      }, 5400);

      return () => clearTimeout(timer);
    }
  }, [recipes, filteredRecipes.length]);

  return (
    <>
      {/* 🔝 Search Header */}
      <div className="fixed top-0 left-0 w-full bg-[var(--color-brand)] z-50 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Wat gaan we eten?"
          />
        </div>
      </div>

      <main className="min-h-dvh bg-[var(--color-bg)] pt-20 pb-24">
        {/* Filters */}
        <div className="pt-4 pb-4">
          <div className="flex gap-3 overflow-x-auto px-4 max-w-4xl mx-auto no-scrollbar">
            {categories.map((cat) => {
              const count = getCount(cat);
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap border flex items-center gap-2 transition ${
                    isActive
                      ? "bg-gray-200 text-gray-900 font-medium border-gray-200"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  <span>{cat}</span>
                  {cat !== "Alles" && (
                    <span className="text-xs opacity-60">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-4 max-w-4xl mx-auto">
          {/* 💀 Skeleton alleen zolang recipes null is */}
          {recipes === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 animate-pulse shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          <Card className="mb-4 p-4">
            <button
              onClick={() => setIsIngredientSheetOpen(true)}
              className="w-full text-left flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Kook iets lekkers
                </p>
                <p className="text-xs text-gray-500">
                  met wat je nog in huis hebt
                </p>
              </div>
              <span className="text-[var(--color-accent)] text-sm font-medium">
                Start
              </span>
            </button>
          </Card>

          {/* 🍽️ Empty state */}
          {recipes !== null && filteredRecipes.length === 0 && (
            <Card>
              <EmptyRecipesState category={activeCategory} />
            </Card>
          )}

          {/* 🍽️ Grid */}
          {recipes !== null && filteredRecipes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipe/${recipe.id}`}
                  className="block hover:shadow-md transition shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl"
                >
                  <Card overflow>
                    {recipe.image_url ? (
                      <div className="h-40 w-full">
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gray-200 w-full" />
                    )}

                    <div className="p-4 space-y-2">
                      <p className="text-xs text-gray-400">
                        {new Date(recipe.created_at).toLocaleDateString(
                          "nl-NL",
                        )}
                      </p>

                      <h2 className="text-xl font-semibold leading-tight">
                        {recipe.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {recipe.cooking_time && (
                          <div className="flex items-center gap-1">
                            <Icon icon={ClockIcon} size={16} />
                            <span>{recipe.cooking_time} min</span>
                          </div>
                        )}

                        {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <Icon icon={UserIcon} size={16} />
                            <span>
                              {recipe.servings}{" "}
                              {recipe.servings === 1 ? "persoon" : "personen"}
                            </span>
                          </div>
                        )}
                        {recipe.category && (
                          <div className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg">
                            {recipe.category}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SwipeableSheet
        open={isIngredientSheetOpen}
        onClose={() => setIsIngredientSheetOpen(false)}
        title="Wat heb je nog in huis?"
        height="70vh"
        // className="max-h-[460px]"
      >
        <div className="px-6 flex flex-col gap-4">
          <textarea
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            placeholder="Bijv: paprika, ui, zoete aardappel, rijst"
            rows={3}
            disabled={generating}
            className={clsx(
              styles.input.default,
              "transition-all duration-200",
              generating && "opacity-60 bg-gray-50 cursor-not-allowed",
            )}
          />
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Aantal</label>

            <div className="flex items-center gap-2">
              <div className="relative w-16">
                <select
                  value={selectedServings}
                  onChange={(e) => setSelectedServings(Number(e.target.value))}
                  className="
          appearance-none
          w-full
          bg-gray-50
          border border-gray-200
          rounded-full
          px-3 py-2
          text-sm
          text-center
          focus:outline-none
          focus:border-[var(--color-accent)]
          cursor-pointer
        "
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>

                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <span className="text-sm text-gray-600">
                {selectedServings === 1 ? "persoon" : "personen"}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Categorie</label>

            <div className="relative w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="
        appearance-none
        w-full
        bg-gray-50
        border border-gray-200
        rounded-full
        px-4 py-3
        text-sm
        focus:outline-none
        focus:border-[var(--color-accent)]
        cursor-pointer
      "
              >
                {["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"].map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={clsx(
              styles.button.primary,
              "h-[58px] relative flex items-center justify-center mx-auto overflow-hidden transition-all duration-300",
              generating ? "bg-gray-200 w-8" : "w-full",
            )}
          >
            {/* Tekst */}
            {showText && !generating && (
              <span className="absolute">Genereer recept</span>
            )}

            {/* Spinner */}
            {generating && (
              <ArrowPathIcon className="w-6 h-6 animate-spin absolute text-gray-600" />
            )}
          </button>
        </div>
      </SwipeableSheet>
    </>
  );
}
