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

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      const now = new Date();
      const jsDay = now.getDay();
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayIndex);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      // Alles parallel fetchen
      const [recipesRes, favsRes, plannedRes] = await Promise.all([
        supabase
          .from("recipes")
          .select("*")
          .eq("household_id", membership.household_id)
          .order("created_at", { ascending: false }),
        supabase.from("favorites").select("recipe_id").eq("user_id", user.id),
        supabase
          .from("week_plans")
          .select("recipe_id")
          .eq("household_id", membership.household_id)
          .eq("week_start", weekStartStr)
          .eq("day_index", dayIndex)
          .maybeSingle(),
      ]);

      setRecipes(recipesRes.data || []);
      if (favsRes.data) setFavorites(favsRes.data.map((f) => f.recipe_id));

      // Today recipe uit de al opgehaalde recepten halen — geen extra query nodig
      if (plannedRes.data?.recipe_id) {
        const todayR = recipesRes.data?.find(
          (r) => r.id === plannedRes.data!.recipe_id,
        );
        if (todayR) setTodayRecipe(todayR);
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

  const [view, setView] = useState<"list" | "grid">("list");
  const [sliderView, setSliderView] = useState<"list" | "grid">("list");
  const [stretching, setStretching] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleViewChange = (newView: "list" | "grid") => {
    if (newView === view) return;
    setStretching(true);
    setVisible(false);
    setTimeout(() => {
      setSliderView(newView);
      setStretching(false);
      setView(newView);
      setVisible(true);
    }, 150);
  };

  // Gedeelde metadata + labels render helper
  const RecipeMeta = ({
    recipe,
    light = false,
  }: {
    recipe: any;
    light?: boolean;
  }) => (
    <div
      className={`flex items-center gap-2 flex-wrap text-xs ${light ? "text-white/85" : "text-[var(--color-text-secondary)]"}`}
    >
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
        <span
          className={`px-2 py-0.5 rounded-md border text-xs ${light ? "border-white/40 text-white/85" : "border-gray-200 text-gray-500"}`}
        >
          {recipe.category}
        </span>
      )}
      {recipe.is_ai && (
        <span
          className={`px-2 py-0.5 rounded-md border text-xs flex items-center gap-1 ${light ? "border-white/40 text-white/85" : "border-[rgb(var(--color-secondaccent)/0.30)] text-[rgb(var(--color-secondaccent))]"}`}
        >
          <WandSparkles size={10} />
          AI
        </span>
      )}
    </div>
  );

  return (
    <main className="px-4 min-h-dvh bg-[var(--color-bg)] pb-32">
      {/* Frosted glass — alleen zichtbaar na scrollen */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
        style={{
          height: "env(safe-area-inset-top)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          backgroundColor: "rgba(255,255,255,0.7)",
        }}
      />

      {/* ── Hero greeting ── */}
      <div
        className="relative pb-8"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
      >
        <p className="text-[15px] font-medium text-[var(--color-accent)] mb-1 tracking-wide">
          {greeting}
          {userName ? ` ${userName}` : ""}
        </p>
        <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">
          Wat staat er
          <br />
          op het menu?
        </h1>
      </div>

      {/* ── Gepland voor vandaag ── */}
      {recipes === null && (
        <div className="mb-8 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-36 mb-3" />
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-200">
            <div className="h-44 bg-gray-100" />
          </div>
        </div>
      )}
      {recipes !== null && todayRecipe && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            Gepland voor vandaag
          </h3>
          <Link href={`/recipe/${todayRecipe.id}`}>
            <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-200">
              {todayRecipe.image_url ? (
                <div className="relative w-full h-44">
                  <img
                    src={todayRecipe.image_url}
                    alt={todayRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="!text-white font-semibold text-lg leading-tight mb-2">
                      {formatTitle(todayRecipe.title)}
                    </h3>
                    <RecipeMeta recipe={todayRecipe} light />
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="font-semibold text-base mb-2">
                    {formatTitle(todayRecipe.title)}
                  </h3>
                  <RecipeMeta recipe={todayRecipe} />
                </div>
              )}
            </div>
          </Link>
        </div>
      )}
      {/* ── Recepten header + toggle ── */}
      <div className="flex items-end justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {activeCategory === "Alles" ? "Alle recepten" : activeCategory}
          {recipes !== null && (
            <span className="ml-2 text-xs font-semibold text-gray-400">
              {filteredRecipes.length}
            </span>
          )}
        </h3>

        <div className="relative flex items-center bg-white border border-gray-200 rounded-full p-1">
          {/* Sliding achtergrond */}
          <div
            className={clsx(
              "absolute top-1 bottom-1 rounded-full bg-gray-800 transition-all duration-300 ease-in-out",
              stretching
                ? "left-1 right-1" // strekt uit over beide knoppen
                : sliderView === "grid"
                  ? "left-11 right-1"
                  : "left-1 right-11",
            )}
          />

          <button
            onClick={() => handleViewChange("list")}
            className={clsx(
              "relative z-10 w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300",
              view === "list" ? "text-white" : "text-gray-400",
            )}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => handleViewChange("grid")}
            className={clsx(
              "relative z-10 w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300",
              view === "grid" ? "text-white" : "text-gray-400",
            )}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      <div className="">
        {/* Skeleton */}
        {recipes === null && (
          <div className="animate-pulse">
            {/* Recepten skeleton */}
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-200"
                >
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recipes !== null && filteredRecipes.length === 0 && (
          <Card>
            <EmptyRecipesState category={activeCategory} />
          </Card>
        )}

        {/* Recepten lijst / grid */}
        <div
          className={clsx(
            "transition-all duration-400 ease-in-out",
            view === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-4",
            visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]",
          )}
        >
          {filteredRecipes.map((recipe) => {
            const isFavorite = favorites.includes(recipe.id);

            if (view === "grid") {
              return (
                <Link
                  key={recipe.id}
                  href={`/recipe/${recipe.id}`}
                  className="block overflow-hidden active:scale-[0.98] transition rounded-3xl ring ring-gray-200"
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
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2"
                    >
                      <Heart
                        size={20}
                        strokeWidth={1.5}
                        className={
                          isFavorite
                            ? "text-[var(--color-accent)] fill-[var(--color-accent)]"
                            : "text-gray-400"
                        }
                      />
                    </button>
                  </div>
                  <div className="p-3">
                    <h2 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] mb-1.5">
                      {formatTitle(recipe.title)}
                    </h2>
                    <RecipeMeta recipe={recipe} />
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
                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-gray-200">
                  {recipe.image_url && (
                    <div className="relative w-full h-48">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0  to-transparent" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFavorite(recipe.id);
                        }}
                        className="absolute top-3 right-3 bg-white/85 backdrop-blur-md rounded-full p-2 shadow-sm"
                      >
                        <Heart
                          size={20}
                          strokeWidth={1.5}
                          className={
                            isFavorite
                              ? "text-[var(--color-accent)] fill-[var(--color-accent)]"
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
                    <RecipeMeta recipe={recipe} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
