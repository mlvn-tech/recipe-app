"use client";

import { useMemo, useState, useEffect } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import {
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import { supabase } from "@/lib/supabase";

export default function WeekPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const [weekPlan, setWeekPlan] = useState<Record<number, any[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");

  const categories = ["Alles", "Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  // 🔥 Base date afhankelijk van weekOffset
  const baseDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [weekOffset]);

  // 🔥 Week start gebaseerd op baseDate
  const weekStartDate = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    return start.toISOString().split("T")[0];
  }, [baseDate]);

  useEffect(() => {
    document.body.style.overflow = activeDay !== null ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeDay]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch recipes error:", error);
        return;
      }

      setRecipes(data || []);
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    const fetchWeekPlan = async () => {
      const { data, error } = await supabase
        .from("week_plans")
        .select("day_index, recipe_id, recipes(*)")
        .eq("week_start", weekStartDate);

      if (error) {
        console.error("Fetch week plan error:", error);
        return;
      }

      const grouped: Record<number, any[]> = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
      };

      data?.forEach((item: any) => {
        if (item.recipes) {
          grouped[item.day_index].push(item.recipes);
        }
      });

      setWeekPlan(grouped);
    };

    fetchWeekPlan();
  }, [weekStartDate]);

  const shoppingList = useMemo(() => {
    const allIngredients: string[] = [];

    Object.values(weekPlan).forEach((dayRecipes) => {
      dayRecipes.forEach((recipe: any) => {
        if (recipe.ingredients) {
          allIngredients.push(...recipe.ingredients);
        }
      });
    });

    return [...new Set(allIngredients)];
  }, [weekPlan]);

  const closeSheet = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveDay(null);
      setIsClosing(false);
    }, 300);
  };

  const toggleRecipeForDay = async (recipe: any) => {
    if (activeDay === null) return;

    const exists = weekPlan[activeDay].some((r) => r.id === recipe.id);

    if (exists) {
      const { error } = await supabase
        .from("week_plans")
        .delete()
        .eq("week_start", weekStartDate)
        .eq("day_index", activeDay)
        .eq("recipe_id", recipe.id);

      if (error) return;

      setWeekPlan((prev) => ({
        ...prev,
        [activeDay]: prev[activeDay].filter((r) => r.id !== recipe.id),
      }));
    } else {
      const { error } = await supabase.from("week_plans").insert({
        week_start: weekStartDate,
        day_index: activeDay,
        recipe_id: recipe.id,
      });

      if (error) return;

      setWeekPlan((prev) => ({
        ...prev,
        [activeDay]: [...prev[activeDay], recipe],
      }));
    }
  };

  const removeFromDay = async (dayIndex: number, recipeId: string) => {
    const { error } = await supabase
      .from("week_plans")
      .delete()
      .eq("week_start", weekStartDate)
      .eq("day_index", dayIndex)
      .eq("recipe_id", recipeId);

    if (error) return;

    setWeekPlan((prev) => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((r) => r.id !== recipeId),
    }));
  };

  // 🔥 Week data gebaseerd op baseDate
  const weekData = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay() + 1);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      return {
        label: date.toLocaleDateString("nl-NL", { weekday: "long" }),
        shortDate: date.toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "short",
        }),
      };
    });
  }, [baseDate]);

  // 🔥 Week label gebaseerd op baseDate
  const weekLabel = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay() + 1);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    })} – ${end.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    })}`;
  }, [baseDate]);

  const getCategoryCount = (cat: string) => {
    if (cat === "Alles") return null;
    return recipes.filter(
      (r) => r.category?.toLowerCase() === cat.toLowerCase(),
    ).length;
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory =
      activeCategory === "Alles" ||
      recipe.category?.toLowerCase() === activeCategory.toLowerCase();

    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Header title="Weekplanner" subtitle={weekLabel} />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-28">
        <div className="flex items-center justify-between px-4 max-w-4xl mx-auto mt-6 mb-6">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="flex items-center gap-2 py-2 rounded-lg active:scale-95 transition text-gray-700 font-medium"
          >
            <Icon icon={ChevronLeftIcon} size={18} />
            <span>Vorige week</span>
          </button>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="flex items-center gap-2 py-2 rounded-lg active:scale-95 transition text-gray-700 font-medium"
          >
            <span>Volgende week</span>
            <Icon icon={ChevronRightIcon} size={18} />
          </button>
        </div>

        <div className="px-4 max-w-4xl mx-auto space-y-4">
          {weekData.map((day, index) => (
            <Card key={index} className="p-5 space-y-4">
              <div className="sticky top-0 bg-white z-10 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="capitalize font-semibold text-lg">
                      {day.label}
                    </h2>
                    <p className="text-sm text-gray-400">{day.shortDate}</p>
                  </div>

                  <button
                    onClick={() => setActiveDay(index)}
                    className="flex items-center gap-1 text-sm text-[var(--color-accent)] hover:opacity-80 transition"
                  >
                    <Icon icon={PlusIcon} size={18} />
                    Voeg toe
                  </button>
                </div>
              </div>

              {weekPlan[index].length === 0 ? (
                <div className="text-sm text-gray-400">
                  Nog geen recepten gepland.
                </div>
              ) : (
                <div className="space-y-2">
                  {weekPlan[index].map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                          {recipe.image_url && (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <span className="truncate max-w-[200px]">
                          {recipe.title}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromDay(index, recipe.id)}
                        className="text-gray-400 hover:text-red-500 transition shrink-0"
                      >
                        <Icon icon={XMarkIcon} size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Boodschappenlijst</h2>

            {shoppingList.length === 0 ? (
              <p className="text-sm text-gray-400">
                Geen ingrediënten geselecteerd.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {shoppingList.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-gray-400 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>

      <div
        className={`
          fixed inset-0 z-50 transition
          ${activeDay !== null ? "visible" : "invisible"}
        `}
      >
        <div
          onClick={closeSheet}
          className={`
            absolute inset-0 bg-black/30 transition-opacity
            ${activeDay !== null && !isClosing ? "opacity-100" : "opacity-0"}
          `}
        />

        <div
          className={`
            absolute bottom-0 left-0 w-full
            bg-white rounded-t-3xl
            h-[85vh]
            flex flex-col
            transition-transform duration-300
            ${
              activeDay !== null && !isClosing
                ? "translate-y-0"
                : "translate-y-full"
            }
          `}
        >
          <div className="p-6 pb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Kies een recept</h3>
              <button onClick={closeSheet}>
                <Icon icon={XMarkIcon} />
              </button>
            </div>
          </div>

          <div className="px-6 mb-4">
            <input
              type="text"
              placeholder="Zoek recept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-full p-3 bg-gray-50 focus:outline-none focus:border-gray-300"
            />
          </div>

          <div className="px-6 flex gap-3 overflow-x-auto mb-4">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition flex items-center gap-2
                    ${
                      isActive
                        ? "bg-gray-200 border-gray-200 font-medium"
                        : "bg-white border-gray-200 text-gray-600"
                    }
                  `}
                >
                  <span>{cat}</span>
                  {count !== null && (
                    <span className="text-xs opacity-60">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-28 space-y-2 min-h-[200px]">
            {filteredRecipes.length === 0 ? (
              <div className="text-sm text-gray-400 py-6 text-center">
                Geen recepten gevonden.
              </div>
            ) : (
              filteredRecipes.map((recipe) => {
                const isSelected =
                  activeDay !== null &&
                  weekPlan[activeDay].some((r) => r.id === recipe.id);

                return (
                  <button
                    key={recipe.id}
                    onClick={() => toggleRecipeForDay(recipe)}
                    className={`
                      w-full flex items-center justify-between
                      px-4 py-3 rounded-xl transition
                      ${
                        isSelected
                          ? "bg-[var(--color-accent)]/10"
                          : "bg-gray-50 hover:bg-gray-100"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        {recipe.image_url && (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <span className="text-sm text-left truncate max-w-[200px]">
                        {recipe.title}
                      </span>
                    </div>

                    <div
                      className={`
                        h-5 w-5 rounded border flex items-center justify-center
                        ${
                          isSelected
                            ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                            : "border-gray-300"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 bg-white rounded-sm" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
