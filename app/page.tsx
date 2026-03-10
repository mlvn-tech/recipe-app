"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  Clock,
  User,
  Heart,
  LayoutGrid,
  List,
  Search,
  WandSparkles,
  ChevronRight,
} from "lucide-react";

import Icon from "@/components/icons";
import Link from "next/link";
import Card from "@/components/Card";

import EmptyRecipesState from "@/components/EmptyRecipesState";
import { useUI } from "@/components/UIContext";
import { styles } from "@/lib/styles";
import clsx from "clsx";
import { formatTitle } from "@/lib/utils";

type Filter = { name: string; count: number };

export default function Home() {
  const [recipes, setRecipes] = useState<any[] | null>(null);
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");
  const router = useRouter();
  const { setHighlightCreate } = useUI();
  const [generating, setGenerating] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");
  const [showText, setShowText] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [todayRecipe, setTodayRecipe] = useState<any | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Goedemorgen");
    else if (hour < 18) setGreeting("Goedemiddag");
    else setGreeting("Goedenavond");

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const name = data?.user?.user_metadata?.name ?? "";
      setUserName(name);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (generating) {
      setShowText(false);
    } else {
      const timer = setTimeout(() => setShowText(true), 300);
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
      await supabase
        .from("favorites")
        .insert({ user_id: userId, recipe_id: recipeId });
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

      const { data: favs } = await supabase
        .from("favorites")
        .select("recipe_id")
        .eq("user_id", user.id);
      if (favs) setFavorites(favs.map((f) => f.recipe_id));

      // Weekplanner: bereken week_start (maandag) en day_index
      const now = new Date();
      const jsDay = now.getDay();
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayIndex);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const { data: plannedToday } = await supabase
        .from("week_plans")
        .select("recipe_id")
        .eq("household_id", membership.household_id)
        .eq("week_start", weekStartStr)
        .eq("day_index", dayIndex)
        .maybeSingle();

      if (plannedToday?.recipe_id) {
        const { data: recipe } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", plannedToday.recipe_id)
          .maybeSingle();
        if (recipe) setTodayRecipe(recipe);
      }
    };

    fetchRecipes();
    const { data: listener } = supabase.auth.onAuthStateChange(() =>
      fetchRecipes(),
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const baseCategories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const getCount = (cat: string) => {
    if (!recipes) return 0;
    if (cat === "Favorieten") return favorites.length;
    if (cat === "Alles") return recipes.length;
    return recipes.filter(
      (r) => r.category?.toLowerCase() === cat.toLowerCase(),
    ).length;
  };

  const sortedCategories = baseCategories
    .map((cat) => ({ name: cat, count: getCount(cat) }))
    .sort((a, b) =>
      b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name),
    );

  const finalFilters: Filter[] = [
    { name: "Alles", count: recipes?.length ?? 0 },
    { name: "Favorieten", count: favorites.length },
    ...sortedCategories,
  ];

  const filteredRecipes =
    recipes?.filter((recipe) => {
      const matchesSearch = recipe.title
        .toLowerCase()
        .includes(search.toLowerCase());
      if (activeCategory === "Alles") return matchesSearch;
      if (activeCategory === "Favorieten")
        return matchesSearch && favorites.includes(recipe.id);
      return (
        matchesSearch &&
        recipe.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }) ?? [];

  useEffect(() => {
    if (recipes !== null && filteredRecipes.length === 0) {
      setHighlightCreate(true);
      const timer = setTimeout(() => setHighlightCreate(false), 5400);
      return () => clearTimeout(timer);
    }
  }, [recipes, filteredRecipes.length]);

  return (
    <main className="min-h-dvh bg-white pb-32">
      {/* ── Hero greeting ── */}
      <div className="relative px-5 pt-14 pb-8">
        <p className="text-[15px] font-medium text-[#F4A261] mb-1 tracking-wide">
          {greeting}
          {userName ? `, ${userName}` : ""}
        </p>
        <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">
          Wat gaan we
          <br />
          tjappen vandaag?
        </h1>
      </div>

      {/* ── Search + toggle ── */}
      <div className="px-5 flex gap-3 mb-5">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Search
              size={18}
              className="text-gray-400 transition-colors group-focus-within:text-gray-600"
            />
          </div>
          <input
            type="text"
            placeholder="Zoek een recept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-white border border-[#EAE8E3] p-3 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#D4D0C8] transition shadow-sm"
          />
        </div>

        <div className="flex items-center bg-white border border-[#EAE8E3] rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setView("list")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${
              view === "list"
                ? "bg-[var(--color-accent)] text-white"
                : "text-gray-400"
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${
              view === "grid"
                ? "bg-[#F5F3EF] text-gray-700 shadow-sm"
                : "text-gray-400"
            }`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="mb-7">
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
          style={{
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            scrollPaddingLeft: "1.25rem",
          }}
        >
          {finalFilters.map((item) => {
            const isActive = activeCategory === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveCategory(item.name)}
                className={`snap-start flex-shrink-0 px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition font-medium ${
                  isActive
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-[#EAE8E3]"
                }`}
              >
                {item.name}
                {item.name !== "Alles" && (
                  <span
                    className={`ml-2 text-xs ${isActive ? "opacity-60" : "opacity-40"}`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Gepland voor vandaag ── */}
      {todayRecipe && (
        <div className="px-5 mb-8">
          <h3 className="text-xs font-semibold text-gray-400 tracking-widest mb-3">
            Gepland voor vandaag
          </h3>
          <Link href={`/recipe/${todayRecipe.id}`}>
            <div className="relative rounded-3xl overflow-hidden bg-white border border-[#EAE8E3]">
              {todayRecipe.image_url && (
                <div className="relative w-full h-44">
                  <img
                    src={todayRecipe.image_url}
                    alt={todayRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay onderaan */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="!text-white font-semibold text-lg leading-tight">
                      {formatTitle(todayRecipe.title)}
                    </h3>
                    <div className="flex items-center gap-4 mt-1.5 text-white/80 text-sm">
                      {todayRecipe.cooking_time && (
                        <div className="flex items-center gap-1">
                          <Clock size={13} />
                          <span>{todayRecipe.cooking_time} min.</span>
                        </div>
                      )}
                      {todayRecipe.servings && (
                        <div className="flex items-center gap-1">
                          <User size={13} />
                          <span>{todayRecipe.servings} pers.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Geen foto fallback */}
              {!todayRecipe.image_url && (
                <div className="p-4">
                  <h3 className="font-semibold text-base">
                    {formatTitle(todayRecipe.title)}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {todayRecipe.cooking_time && (
                      <div className="flex items-center gap-1">
                        <Clock size={13} />
                        <span>{todayRecipe.cooking_time} min.</span>
                      </div>
                    )}
                    {todayRecipe.servings && (
                      <div className="flex items-center gap-1">
                        <User size={13} />
                        <span>{todayRecipe.servings} pers.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* ── Recepten ── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 tracking-widest">
            {activeCategory === "Alles" ? "Alle recepten" : activeCategory}
          </p>
          {recipes !== null && (
            <span className="text-xs text-gray-400">
              {filteredRecipes.length} recepten
            </span>
          )}
        </div>

        {/* Skeleton */}
        {recipes === null && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-sm"
              >
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {recipes !== null && filteredRecipes.length === 0 && (
          <Card>
            <EmptyRecipesState category={activeCategory} />
          </Card>
        )}

        {/* Recepten lijst / grid */}
        {recipes !== null && filteredRecipes.length > 0 && (
          <div
            className={
              view === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-4"
            }
          >
            {filteredRecipes.map((recipe) => {
              const isFavorite = favorites.includes(recipe.id);

              if (view === "grid") {
                return (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    className="block rounded-2xl overflow-hidden bg-white border border-[#EAE8E3] active:scale-[0.98] transition"
                  >
                    <div className="aspect-[4/3] relative">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFavorite(recipe.id);
                        }}
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5"
                      >
                        <Heart
                          size={14}
                          strokeWidth={1.5}
                          className={
                            isFavorite
                              ? "text-[#F4A261] fill-[#F4A261]"
                              : "text-gray-400"
                          }
                        />
                      </button>
                    </div>
                    <div className="p-3">
                      <h2 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">
                        {formatTitle(recipe.title)}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        {recipe.cooking_time && (
                          <div className="flex items-center gap-0.5">
                            <Clock size={11} />
                            <span>{recipe.cooking_time}m</span>
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center gap-0.5">
                            <User size={11} />
                            <span>{recipe.servings}p</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              }

              // List view
              return (
                <Link
                  key={recipe.id}
                  href={`/recipe/${recipe.id}`}
                  className="block active:scale-[0.99] transition"
                >
                  <div className="bg-white rounded-2xl overflow-hidden border border-[#EAE8E3]">
                    {recipe.image_url && (
                      <div className="relative w-full h-48">
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Gradient + info overlay onderaan foto */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFavorite(recipe.id);
                          }}
                          className="absolute top-3 right-3 bg-white/85 backdrop-blur-md rounded-full p-2 shadow-sm"
                        >
                          <Heart
                            size={16}
                            strokeWidth={1.5}
                            className={
                              isFavorite
                                ? "text-[#F4A261] fill-[#F4A261]"
                                : "text-gray-500"
                            }
                          />
                        </button>
                      </div>
                    )}

                    <div className="px-4 py-3.5">
                      <h2 className="text-base font-semibold leading-snug mb-2">
                        {formatTitle(recipe.title)}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        {recipe.cooking_time && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{recipe.cooking_time} min.</span>
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{recipe.servings} pers.</span>
                          </div>
                        )}
                        {recipe.category && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-gray-500">
                            {recipe.category}
                          </span>
                        )}
                        {recipe.is_ai && (
                          <span className="px-2 py-0.5 rounded-lg border border-[rgb(var(--color-secondaccent)/0.30)] text-[rgb(var(--color-secondaccent))] flex items-center gap-1">
                            <WandSparkles size={10} />
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
