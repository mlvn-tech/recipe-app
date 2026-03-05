"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ClockIcon,
  UserIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  BeakerIcon,
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Icon from "@/components/icons";
import Link from "next/link";
import Card from "@/components/Card";
import SearchInput from "@/components/SearchInput";
import EmptyRecipesState from "@/components/EmptyRecipesState";
import { useUI } from "@/components/UIContext";
import SwipeableSheet from "@/components/SwipeableSheet";
import { styles } from "@/lib/styles";
import clsx from "clsx";
import { formatTitle } from "@/lib/utils";

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
  const [servingsOpen, setServingsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [showText, setShowText] = useState(true);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    if (generating) {
      setShowText(false);
    } else {
      const timer = setTimeout(() => {
        setShowText(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [generating]);

  const handleFavorite = (id: string) => {
    toggleFavorite(id);

    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 180);
  };

  const toggleFavorite = async (recipeId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) return;

    const isFav = favorites.includes(recipeId);

    if (isFav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipeId);

      setFavorites((prev) => prev.filter((id) => id !== recipeId));
    } else {
      await supabase.from("favorites").insert({
        user_id: userId,
        recipe_id: recipeId,
      });

      setFavorites((prev) => [...prev, recipeId]);
    }
  };

  const handleGenerate = async () => {
    if (!ingredientInput.trim()) return;

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
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return;
      }

      if (!data.error) {
        localStorage.setItem("ai_preview", JSON.stringify(data));
        router.push("/recipe/preview");
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRecipes([]);
        return;
      }

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        setRecipes([]);
        return;
      }

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("household_id", membership.household_id)
        .order("created_at", { ascending: false });

      setRecipes(data || []);

      // ✅ Favorites ophalen
      const { data: favs } = await supabase
        .from("favorites")
        .select("recipe_id")
        .eq("user_id", user.id);

      if (favs) {
        setFavorites(favs.map((f) => f.recipe_id));
      }
    };

    fetchRecipes();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchRecipes();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const baseCategories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const getCount = (cat: string) => {
    if (!recipes) return 0;

    if (cat === "Favorieten") {
      return favorites.length;
    }

    if (cat === "Alles") {
      return recipes.length;
    }

    return recipes.filter(
      (recipe) => recipe.category?.toLowerCase() === cat.toLowerCase(),
    ).length;
  };

  const sortedCategories = baseCategories
    .map((cat) => ({
      name: cat,
      count: getCount(cat),
    }))
    .sort((a, b) => {
      // Eerst op aantal (hoog naar laag)
      if (b.count !== a.count) return b.count - a.count;
      // Daarna alfabetisch voor stabiliteit
      return a.name.localeCompare(b.name);
    });

  const finalFilters = [
    { name: "Alles", count: recipes?.length ?? 0 },
    { name: "Favorieten", count: favorites.length },
    ...sortedCategories,
  ];

  const filteredRecipes =
    recipes?.filter((recipe) => {
      const matchesSearch = recipe.title
        .toLowerCase()
        .includes(search.toLowerCase());

      if (activeCategory === "Alles") {
        return matchesSearch;
      }

      if (activeCategory === "Favorieten") {
        return matchesSearch && favorites.includes(recipe.id);
      }

      const matchesCategory =
        recipe.category?.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    }) ?? [];

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
      <div
        className="fixed top-0 left-0 w-full z-50 bg-[var(--color-brand)] shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Wat gaan we eten?"
            />
          </div>

          <button
            onClick={() => setIsIngredientSheetOpen(true)}
            className="text-gray-500 p-3 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center active:scale-95 transition"
          >
            <Icon icon={BeakerIcon} size={20} />
          </button>
        </div>
      </div>

      <main
        style={{ paddingTop: "var(--header-height)" }}
        className="min-h-dvh bg-[var(--color-bg)] pb-24"
      >
        {/* Filters */}
        <div className="pt-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <div
              className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
              style={{
                scrollPaddingLeft: "1rem",
                scrollPaddingRight: "1rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
            >
              {finalFilters.map((item) => {
                const cat = item.name;
                const count = item.count;
                const isActive = activeCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`snap-start px-4 py-2 rounded-xl text-sm whitespace-nowrap border flex items-center gap-2 transition ${
                      isActive
                        ? "bg-gray-200 text-gray-900 font-medium border-gray-200"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    <span>{cat}</span>
                    {cat !== "Alles" && (
                      <span className="opacity-60">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 max-w-4xl mx-auto">
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

          {recipes !== null && filteredRecipes.length === 0 && (
            <Card>
              <EmptyRecipesState category={activeCategory} />
            </Card>
          )}

          {recipes !== null && filteredRecipes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => {
                const isFavorite = favorites.includes(recipe.id);

                return (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    className="block hover:shadow-md transition shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl"
                  >
                    <Card overflow>
                      <div className="relative h-40 w-full">
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200" />
                        )}

                        {/* ❤️ Favorite button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFavorite(recipe.id);
                          }}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-sm"
                          style={{
                            transform:
                              animatingId === recipe.id
                                ? "scale(1.1)"
                                : "scale(1)",
                            transition: "transform 0.18s ease-out",
                          }}
                        >
                          <Icon
                            icon={isFavorite ? HeartSolid : HeartOutline}
                            className={`${
                              isFavorite
                                ? "text-[var(--color-accent)]"
                                : "text-gray-500"
                            } transition`}
                          />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        <h2 className="text-xl font-semibold leading-tight">
                          {formatTitle(recipe.title)}
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
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SwipeableSheet
        open={isIngredientSheetOpen}
        onClose={() => setIsIngredientSheetOpen(false)}
        title="Welke ingrediënten heb je nog in huis?"
        height="auto"
        maxHeight="60dvh"
        overflowVisible
      >
        <div
          className="px-6 space-y-3 pt-2"
          style={{
            paddingBottom: "calc(7rem + env(safe-area-inset-bottom))",
          }}
        >
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

          {/* Aantal + Categorie naast elkaar */}
          <div className="flex gap-4">
            {/* Aantal */}
            <div className="flex flex-col gap-2 w-16">
              <label className="block text-sm font-medium">Porties</label>

              <div className="relative">
                <select
                  value={selectedServings}
                  onChange={(e) => setSelectedServings(Number(e.target.value))}
                  className={clsx(
                    styles.dropdown.trigger,
                    "appearance-none cursor-pointer text-center",
                  )}
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>

                <Icon
                  icon={ChevronDownIcon}
                  size={20}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Categorie */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="block text-sm font-medium">Categorie</label>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={clsx(
                    styles.dropdown.trigger,
                    "appearance-none cursor-pointer",
                  )}
                >
                  {["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"].map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ),
                  )}
                </select>

                <Icon
                  icon={ChevronDownIcon}
                  size={20}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={clsx(
              styles.button.primary,
              "h-[58px] mt-6 relative flex items-center justify-center mx-auto transition-all duration-300",
              generating ? "w-[58px] !px-0 bg-gray-200" : "w-full",
            )}
          >
            {/* Tekst */}
            {!generating && <span className="absolute">Genereer recept</span>}

            {/* Spinner */}
            {generating && (
              <ArrowPathIcon className="w-6 h-6 animate-spin absolute text-gray-400" />
            )}
          </button>
        </div>
      </SwipeableSheet>
    </>
  );
}
