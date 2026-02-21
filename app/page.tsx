"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ClockIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import Link from "next/link";

export default function Home() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      setRecipes(data || []);
      setLoading(false);
    };

    fetchRecipes();
  }, []);

  // 👇 Zorgt voor subtiele fade-in na loading
  useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(() => {
        setShowContent(true);
      }, 80);

      return () => clearTimeout(timeout);
    } else {
      setShowContent(false);
    }
  }, [loading]);

  const categories = ["Alles", "Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const getCount = (cat: string) => {
    if (cat === "Alles") return recipes.length;

    return recipes.filter(
      (recipe) => recipe.category?.toLowerCase() === cat.toLowerCase(),
    ).length;
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "Alles" ||
      recipe.category?.toLowerCase() === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* 🔝 Fixed Header */}
      <div className="fixed top-0 left-0 w-full bg-[var(--color-brand)] z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 h-full flex items-center">
          <div className="relative group w-full">
            <input
              type="text"
              placeholder="Wat gaan we eten?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full
                rounded-md
                bg-white/90
                py-2
                pl-4
                pr-10
                text-base
                text-gray-800
                placeholder:text-gray-400
                focus:outline-none
                focus:bg-white
                transition
              "
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon
                icon={MagnifyingGlassIcon}
                size={18}
                className="
                  text-gray-400
                  transition-colors duration-200
                  group-focus-within:text-[var(--color-accent)]
                "
              />
            </div>
          </div>
        </div>
      </div>

      {/* 📦 Page Content */}
      <main className="min-h-screen bg-[var(--color-bg)] pt-20">
        {/* 🏷️ Filters */}
        <div className="pt-4 pb-4">
          <div className="flex gap-3 overflow-x-auto px-4 max-w-4xl mx-auto no-scrollbar">
            {categories.map((cat) => {
              const count = getCount(cat);
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    px-4 py-2 rounded-md text-sm whitespace-nowrap
                    border transition-colors duration-200
                    flex items-center gap-2
                    ${
                      isActive
                        ? "bg-gray-200 text-gray-900 font-medium border-gray-200"
                        : "bg-white text-gray-600 border-gray-200"
                    }
                  `}
                >
                  <span>{cat}</span>

                  {cat !== "Alles" && (
                    <span
                      className={`text-xs ${
                        isActive ? "opacity-90" : "opacity-60"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 📦 Grid */}
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <div className="relative">
            {/* 💀 Skeleton */}
            <div
              className={`
                absolute inset-0 px-0
                transition-all duration-300 ease-out
                ${loading ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
    `}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="
            bg-white
            rounded-md
            overflow-hidden
            p-4
            animate-pulse
            shadow-[0_2px_8px_rgba(0,0,0,0.04)]
          "
                  >
                    <div className="h-40 bg-gray-200 rounded-md mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🍽️ Echte content */}
          <div
            className={`
      transition-all duration-300 ease-out
      ${!loading ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
    `}
          >
            {filteredRecipes.length === 0 ? (
              <div className="bg-white rounded-md p-8 text-center shadow-sm">
                <p className="text-gray-600 mb-3">
                  Hier staan nog geen recepten
                </p>

                {activeCategory !== "Alles" && (
                  <p className="text-sm text-gray-400">
                    Maak snel je eerste{" "}
                    <span className="font-medium">{activeCategory}</span> recept
                    aan!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipe/${recipe.id}`}
                    className="
              block
              bg-white
              rounded-md
              overflow-hidden
              shadow-[0_2px_8px_rgba(0,0,0,0.04)]
              hover:shadow-md
              transition
            "
                  >
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
                            <Icon
                              icon={ClockIcon}
                              size={16}
                              className="text-gray-500"
                            />
                            <span>{recipe.cooking_time} min</span>
                          </div>
                        )}

                        {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <Icon
                              icon={UserIcon}
                              size={16}
                              className="text-gray-500"
                            />
                            <span>{recipe.servings} personen</span>
                          </div>
                        )}

                        {recipe.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded-md capitalize">
                            {recipe.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ➕ Floating Button */}
      <Link
        href="/new"
        className="
          fixed
          bottom-6
          left-1/2
          -translate-x-1/2
          w-11 h-11
          bg-[var(--color-accent)]
          rounded-md
          flex items-center justify-center
          shadow-md
          active:scale-95
          transition
        "
      >
        <Icon icon={PlusIcon} size={24} className="text-white" />
      </Link>
    </>
  );
}
