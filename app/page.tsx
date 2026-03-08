"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  ClockIcon,
  UserIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  HeartIcon as HeartOutline,
  Squares2X2Icon,
  Bars3Icon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Icon from "@/components/icons";
import Link from "next/link";
import Card from "@/components/Card";

import Header from "@/components/Header";

import SearchInput from "@/components/SearchInput";
import EmptyRecipesState from "@/components/EmptyRecipesState";
import { useUI } from "@/components/UIContext";

import { styles } from "@/lib/styles";
import clsx from "clsx";
import { formatTitle } from "@/lib/utils";

export default function Home() {
  const [recipes, setRecipes] = useState<any[] | null>(null);
  const [headerTitle, setHeaderTitle] = useState("Recept");

  const [view, setView] = useState<"list" | "grid">("list");

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

  const [isSticky, setIsSticky] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

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
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 },
    );

    if (stickyRef.current) observer.observe(stickyRef.current);
    return () => observer.disconnect();
  }, []);

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
      {/* Header */}
      <Header title="Mijn recepten" showBack={false} />

      <main
        style={{ paddingTop: "var(--header-height)" }}
        className="min-h-dvh bg-[var(--color-bg)] pb-28"
      >
        {/* Filters */}
        <div className="pt-4">
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

        {/* 🔹 Sticky search + toggle */}
        <div ref={stickyRef} className="h-0" />

        <div
          className={`sticky z-40 bg-[var(--color-bg)] transition-shadow duration-200 pt-4 ${
            isSticky ? "shadow-[0_1px_0_0_#e5e7eb]" : ""
          }`}
          style={{ top: "var(--header-height)" }}
        >
          <div className="px-4 max-w-4xl mx-auto flex gap-3 pb-4">
            <div className="relative group flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Icon
                  icon={MagnifyingGlassIcon}
                  size={22}
                  className="text-gray-400 transition-colors duration-200 group-focus-within:text-gray-500"
                />
              </div>
              <input
                type="text"
                placeholder="Wat gaan we eten?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full bg-white/80 border border-gray-200 backdrop-blur-md p-3 pl-12 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-300transition"
              />
            </div>

            <div className="flex bg-white/80 border border-gray-200 backdrop-blur-md rounded-full p-1">
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-full transition ${
                  view === "list"
                    ? "bg-white shadow-sm text-gray-700"
                    : "text-gray-400"
                }`}
              >
                <Bars3Icon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-full transition ${
                  view === "grid"
                    ? "bg-white shadow-sm text-gray-700"
                    : "text-gray-400"
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 🔹 Recepten */}
        <div className="px-4 max-w-4xl mx-auto">
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
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-4"
                  : "flex flex-col gap-4"
              }
            >
              {filteredRecipes.map((recipe) => {
                const isFavorite = favorites.includes(recipe.id);

                return (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    className="block hover:shadow-md transition shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-xl"
                  >
                    <Card overflow view={view}>
                      <div
                        className={`relative w-full ${
                          view === "grid" ? "aspect-[4/3]" : "h-40"
                        }`}
                      >
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200" />
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFavorite(recipe.id);
                          }}
                          className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-sm"
                        >
                          <Icon
                            icon={isFavorite ? HeartSolid : HeartOutline}
                            className={
                              isFavorite
                                ? "text-[var(--color-accent)]"
                                : "text-gray-500"
                            }
                          />
                        </button>
                      </div>

                      <div
                        className={`flex flex-col ${
                          view === "grid" ? "p-3 gap-1" : "p-4 gap-2"
                        }`}
                      >
                        <h2
                          className={`font-semibold ${
                            view === "grid"
                              ? "text-sm leading-snug line-clamp-2 min-h-[2.5rem] mt-1"
                              : "text-xl leading-tight"
                          }`}
                        >
                          {formatTitle(recipe.title)}
                        </h2>

                        <div
                          className={`flex items-center gap-2 text-gray-600 ${
                            view === "grid" ? "text-xs" : "text-sm"
                          }`}
                        >
                          {recipe.cooking_time && (
                            <div className="text-[var(--color-text-secondary)] flex items-center gap-1">
                              <Icon
                                icon={ClockIcon}
                                size={view === "grid" ? 14 : 16}
                              />
                              <span>{recipe.cooking_time} min.</span>
                            </div>
                          )}

                          {recipe.servings && (
                            <div className="text-[var(--color-text-secondary)] flex items-center gap-1">
                              <Icon
                                icon={UserIcon}
                                size={view === "grid" ? 14 : 16}
                              />
                              <span>{recipe.servings} pers.</span>
                            </div>
                          )}

                          {view === "list" && recipe.category && (
                            <div className="text-[var(--color-text-secondary)] inline-block px-2 py-1 text-xs border border-gray-200 rounded-lg">
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
    </>
  );
}
