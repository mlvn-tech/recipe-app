"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { useMemo, useState, useEffect } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchInput from "@/components/SearchInput";

type ShoppingItem = {
  name: string;
  count: number;
};

export default function WeekPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const [isWeekPickerClosing, setIsWeekPickerClosing] = useState(false);
  const [isShoppingOpen, setIsShoppingOpen] = useState(false); // 👈 ingeklapt

  const weekOptions = [
    { label: "Deze week", offset: 0 },
    { label: "Volgende week", offset: 1 },
    { label: "Over 2 weken", offset: 2 },
    { label: "Over 3 weken", offset: 3 },
  ];

  const [weekPlan, setWeekPlan] = useState<Record<number, any[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [shoppingCount, setShoppingCount] = useState(0);

  useEffect(() => {
    const fetchShoppingCount = async () => {
      const { count } = await supabase
        .from("shopping_list")
        .select("*", { count: "exact", head: true })
        .eq("checked", false);

      setShoppingCount(count || 0);
    };

    fetchShoppingCount();
  }, []);

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");

  const categories = ["Alles", "Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const baseDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [weekOffset]);

  const weekStartDate = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    return start.toISOString().split("T")[0];
  }, [baseDate]);

  const weekLabel = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} t/m ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
  }, [baseDate]);

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

  useEffect(() => {
    document.body.style.overflow =
      activeDay !== null || isWeekPickerOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeDay, isWeekPickerOpen]);

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

  useEffect(() => {
    const fetchWeekPlan = async () => {
      const { data } = await supabase
        .from("week_plans")
        .select("day_index, recipe_id, recipes(*)")
        .eq("week_start", weekStartDate);

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
        if (item.recipes) grouped[item.day_index].push(item.recipes);
      });
      setWeekPlan(grouped);
    };
    fetchWeekPlan();
  }, [weekStartDate]);

  const shoppingList = useMemo((): ShoppingItem[] => {
    const grouped: Record<string, number> = {};
    Object.values(weekPlan).forEach((dayRecipes) => {
      dayRecipes.forEach((recipe: any) => {
        if (!recipe.ingredients) return;
        recipe.ingredients.forEach((ingredient: string) => {
          const cleaned = ingredient.trim().toLowerCase();
          if (!grouped[cleaned]) grouped[cleaned] = 0;
          grouped[cleaned] += 1;
        });
      });
    });
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [weekPlan]);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory =
      activeCategory === "Alles" ||
      recipe.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const closeRecipeSheet = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveDay(null);
      setIsClosing(false);
    }, 300);
  };

  const closeWeekPicker = () => {
    setIsWeekPickerClosing(true);
    setTimeout(() => {
      setIsWeekPickerOpen(false);
      setIsWeekPickerClosing(false);
    }, 300);
  };

  const toggleRecipeForDay = async (recipe: any) => {
    if (activeDay === null) return;
    const exists = weekPlan[activeDay].some((r) => r.id === recipe.id);

    if (exists) {
      await supabase
        .from("week_plans")
        .delete()
        .eq("week_start", weekStartDate)
        .eq("day_index", activeDay)
        .eq("recipe_id", recipe.id);

      setWeekPlan((prev) => ({
        ...prev,
        [activeDay]: prev[activeDay].filter((r) => r.id !== recipe.id),
      }));
    } else {
      await supabase.from("week_plans").insert({
        week_start: weekStartDate,
        day_index: activeDay,
        recipe_id: recipe.id,
      });

      setWeekPlan((prev) => ({
        ...prev,
        [activeDay]: [...prev[activeDay], recipe],
      }));
    }
  };

  const removeFromDay = async (dayIndex: number, recipeId: string) => {
    await supabase
      .from("week_plans")
      .delete()
      .eq("week_start", weekStartDate)
      .eq("day_index", dayIndex)
      .eq("recipe_id", recipeId);

    setWeekPlan((prev) => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((r) => r.id !== recipeId),
    }));
  };

  return (
    <>
      <Header title="Weekplanner" />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-36">
        <div className="px-4 max-w-4xl mx-auto space-y-4">
          {weekData.map((day, index) => (
            <Card key={index} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="capitalize font-semibold text-lg">
                    {day.label}
                  </h2>
                  <p className="text-sm text-gray-400">{day.shortDate}</p>
                </div>

                <button
                  onClick={() => setActiveDay(index)}
                  className="flex items-center gap-1 text-sm text-[var(--color-accent)]"
                >
                  <Icon icon={PlusIcon} size={18} />
                  Voeg toe
                </button>
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
                      <Link
                        href={`/recipe/${recipe.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
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
                      </Link>

                      <button
                        onClick={() => removeFromDay(index, recipe.id)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                      >
                        <Icon icon={XMarkIcon} size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>
      {/* Floating knoppen boven bottom nav */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-2"
        style={{
          bottom: "calc(5rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Week selector */}
        <button
          onClick={() => setIsWeekPickerOpen(true)}
          className={clsx(styles.button.floatingFrosted, "px-6 py-5")}
        >
          {weekLabel}
          <Icon icon={ChevronDownIcon} size={20} className="text-gray-400" />
        </button>

        {/* Boodschappenlijst knop */}
        <div className="relative">
          <button
            onClick={() => router.push(`/shopping?week=${weekStartDate}`)}
            className={clsx(
              styles.button.floatingFrosted,
              "w-15 h-15 justify-center",
            )}
          >
            <Icon icon={ShoppingBagIcon} size={24} className="text-gray-500" />
          </button>

          {/* Notificatie bubbel */}
          {shoppingCount > 0 && (
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-[var(--color-brand)] rounded-full flex items-center justify-center">
              <span className="text-white text-[12px] font-bold">
                {shoppingCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Week picker sheet */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${
          isWeekPickerOpen && !isWeekPickerClosing
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        } bg-black/50`}
      >
        <div onClick={closeWeekPicker} className="absolute inset-0" />

        <div
          className={`fixed bottom-0 left-0 w-full bg-white rounded-t-3xl transition-transform duration-300 ${
            isWeekPickerOpen && !isWeekPickerClosing
              ? "translate-y-0"
              : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <button onClick={closeWeekPicker}>
              <Icon icon={XMarkIcon} size={20} className="text-gray-400" />
            </button>
            <h3 className="font-semibold">Bekijk periode</h3>
            <div className="w-5" />
          </div>

          <div
            className="px-6 space-y-3 pt-4"
            style={{
              paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
            }}
          >
            {weekOptions.map((option) => {
              const start = new Date();
              start.setDate(start.getDate() + option.offset * 7);
              start.setDate(start.getDate() - start.getDay() + 1);
              const end = new Date(start);
              end.setDate(start.getDate() + 6);
              const range = `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} t/m ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
              const isSelected = weekOffset === option.offset;

              return (
                <button
                  key={option.offset}
                  onClick={() => setWeekOffset(option.offset)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    isSelected
                      ? "bg-gray-50 border-gray-100 font-medium"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  <div className="text-left">
                    <div>{option.label}</div>
                    <div
                      className={`text-sm ${isSelected ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {range}
                    </div>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-[var(--color-accent)]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recept picker sheet */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${
          activeDay !== null && !isClosing
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        } bg-black/50`}
      >
        <div onClick={closeRecipeSheet} className="absolute inset-0" />

        <div
          className={`fixed bottom-0 left-0 w-full bg-white rounded-t-3xl transition-transform duration-300 flex flex-col ${
            activeDay !== null && !isClosing
              ? "translate-y-0"
              : "translate-y-full"
          }`}
          style={{ height: "65vh" }}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-2 mb-4">
            <button onClick={closeRecipeSheet}>
              <Icon icon={XMarkIcon} size={20} className="text-gray-400" />
            </button>
            <h3 className="font-semibold">Kies een recept</h3>
            <div className="w-5" />
          </div>

          <div className="px-6 mb-6 shrink-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Zoek recept..."
            />
          </div>

          <div className="px-6 flex gap-3 overflow-x-auto mb-4 no-scrollbar shrink-0">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count =
                cat === "Alles"
                  ? recipes.length
                  : recipes.filter(
                      (r) => r.category?.toLowerCase() === cat.toLowerCase(),
                    ).length;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition ${
                    isActive
                      ? "bg-gray-200 border-gray-200 font-medium"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  <span>{cat}</span>

                  {cat !== "Alles" && count > 0 && (
                    <span className="text-gray-400 font-normal ml-2">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="flex-1 overflow-y-auto px-6 space-y-2"
            style={{
              paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
            }}
          >
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                      isSelected
                        ? "bg-[var(--color-accent)]/10"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
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
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <Icon
                          icon={CheckIcon}
                          size={16}
                          className="text-white"
                        />
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
