"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Clock, User, WandSparkles, Heart, X } from "lucide-react";
import Link from "next/link";
import { formatTitle } from "@/lib/utils";

type Filter = { name: string; count: number };

export default function SearchPage() {
  const [recipes, setRecipes] = useState<any[] | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");
  const inputRef = useRef<HTMLInputElement>(null);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchRecipes = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      console.log("user:", user, "error:", error);
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
    };

    fetchRecipes();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchRecipes();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, recipeId: string) => {
    e.preventDefault();
    e.stopPropagation();

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

  const showResults = true;

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] pb-32">
      {/* Zoekbalk — sticky, direct kind van main */}
      <div
        className="px-4 sticky z-10 bg-[var(--color-bg)]/90 backdrop-blur-md pb-4"
        style={{
          top: 0,
          paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
        }}
      >
        <h1
          className={`font-bold text-gray-900 leading-tight tracking-tight transition-all duration-300 ${
            scrolled ? "text-base mb-2" : "text-[2rem] mb-4"
          }`}
        >
          Zoeken
        </h1>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Search
              size={18}
              className="text-gray-400 transition-colors group-focus-within:text-[var(--color-accent)]"
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Recept, ingrediënt, categorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full bg-white border border-gray-200 p-3 pl-11 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition"
          />
          {search.length > 0 && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
            >
              <X size={18} strokeWidth={1.5} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}

      <div
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth mb-6"
        style={{
          paddingLeft: "1rem",
          paddingRight: "1rem",
          scrollPaddingLeft: "1rem",
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
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {item.name}

              <span
                className={`ml-2 text-xs ${isActive ? "opacity-60" : "opacity-40"}`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Resultaten */}
      <div className="px-4">
        {/* Lege staat — nog niet gezocht */}
        {!showResults && recipes !== null && (
          <div className="pt-8 text-center">
            <p className="text-gray-400 text-sm">
              Zoek op naam of filter op categorie
            </p>
          </div>
        )}

        {/* Skeleton */}
        {recipes === null && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex gap-3 items-center bg-white border border-gray-200 rounded-3xl p-3 animate-pulse"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Geen resultaten */}
        {showResults && recipes !== null && filteredRecipes.length === 0 && (
          <div className="pt-8 text-center">
            <h2 className="text-[var-(--color-text-secondary)]">
              Oeps, niks gevonden
            </h2>
            <p className="pt-4 text-gray-400 text-sm">
              {search
                ? `Geen resultaten voor "${search}"`
                : `Maak snel je eerste ${activeCategory.toLowerCase()} recept aan!`}
            </p>
          </div>
        )}

        {/* Resultaten lijst */}
        {showResults && filteredRecipes.length > 0 && (
          <>
            {/* <p className="text-xs text-gray-400 mb-3">
              {filteredRecipes.length} recepten
            </p> */}
            <div className="flex flex-col gap-3">
              {filteredRecipes.map((recipe) => {
                const isFavorite = favorites.includes(recipe.id);
                return (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    className="relative flex gap-3 items-center bg-white border border-gray-200 rounded-3xl p-3 active:scale-[0.99] transition"
                  >
                    {/* Favorite — rechtsboven */}
                    <button
                      onClick={(e) => toggleFavorite(e, recipe.id)}
                      className="absolute top-3.5 right-3.5"
                    >
                      <Heart
                        size={14}
                        strokeWidth={1.5}
                        className={
                          isFavorite
                            ? "text-[var(--color-accent)] fill-[var(--color-accent)]"
                            : "text-gray-500"
                        }
                      />
                    </button>
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold leading-snug max-w-[190] line-clamp-2 mb-1">
                        {formatTitle(recipe.title)}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] flex-wrap">
                        {recipe.cooking_time && (
                          <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{recipe.cooking_time} min.</span>
                          </div>
                        )}
                        {/* {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <User size={11} />
                            <span>{recipe.servings} pers.</span>
                          </div>
                        )} */}
                        {recipe.category && (
                          <span className="px-2 py-0.5 rounded-lg border border-gray-200 text-[var(--color-text-secondary)]">
                            {recipe.category}
                          </span>
                        )}
                        {recipe.is_ai && (
                          <span className="px-1.5 py-0.5 rounded-lg border border-[rgb(var(--color-secondaccent)/0.30)] text-[rgb(var(--color-secondaccent))] flex items-center gap-1">
                            <WandSparkles size={9} />
                            AI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Favorite */}
                    {/* <button
                      onClick={(e) => toggleFavorite(e, recipe.id)}
                      className="shrink-0 p-1.5"
                     >
                      <Heart
                        size={16}
                        strokeWidth={1.5}
                        className={
                          isFavorite
                            ? "text-[#F4A261] fill-[#F4A261]"
                            : "text-gray-300"
                        }
                      />
                    </button> */}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
