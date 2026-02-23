"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

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
import Card from "@/components/Card";
import SearchInput from "@/components/SearchInput";

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
      {/* 🔝 Search Header */}
      <div className="fixed top-0 left-0 w-full bg-[var(--color-brand)] z-50 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center">
          <div className="relative group w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Wat gaan we eten?"
            />
          </div>
        </div>
      </div>

      {/* 📦 Page Content */}
      <main
        className="min-h-dvh bg-[var(--color-bg)] pt-20 pb-24"
        style={{ overflowAnchor: "none" }}
      >
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
                    px-4 py-2 rounded-xl text-sm whitespace-nowrap
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
                transition-all duration-300 ease-out
                ${
                  loading
                    ? "opacity-100 translate-y-0 relative"
                    : "opacity-0 -translate-y-2 pointer-events-none hidden"
                }
              `}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="
                      bg-white
                      rounded-xl
                      overflow-hidden
                      p-4
                      animate-pulse
                      shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                    "
                  >
                    <div className="h-40 bg-gray-200 rounded-xl mb-4" />
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
              ${
                !loading
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }
            `}
          >
            {filteredRecipes.length === 0 ? (
              <Card className="text-center">
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
              </Card>
            ) : (
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
                              <span>
                                {recipe.servings}{" "}
                                {recipe.servings === 1 ? "persoon" : "personen"}
                              </span>
                            </div>
                          )}

                          {recipe.category && (
                            <span className="px-2 py-1 bg-gray-100 rounded-lg capitalize">
                              {recipe.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
