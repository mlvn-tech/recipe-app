"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { useMemo, useState, useEffect, useRef } from "react";
import Card from "@/components/Card";

import {
  Plus,
  X,
  ChevronDown,
  Check,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import Icon from "@/components/icons";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchInput from "@/components/SearchInput";
import SwipeableSheet from "@/components/SwipeableSheet";

type ShoppingItem = {
  name: string;
  count: number;
};

export default function WeekPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [customInputDay, setCustomInputDay] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [actionMenuDay, setActionMenuDay] = useState<number | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);

  const toggleDayActions = (dayIndex: number) => {
    setActionMenuDay(actionMenuDay === dayIndex ? null : dayIndex);
  };

  const getUserId = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  const getHouseholdId = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle();

    return membership?.household_id || null;
  };

  const weekOptions = [
    { label: "Deze week", offset: 0 },
    { label: "Volgende week", offset: 1 },
    { label: "Over 2 weken", offset: 2 },
    { label: "Over 3 weken", offset: 3 },
  ];

  type DayItem =
    | { type: "recipe"; data: any }
    | { type: "custom"; name: string; id: string };

  const [weekPlan, setWeekPlan] = useState<Record<number, DayItem[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });

  const [shoppingCount, setShoppingCount] = useState(0);

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alles");

  // Scroll detectie voor sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchShoppingCount = async () => {
      const householdId = await getHouseholdId();
      if (!householdId) return;

      const { count } = await supabase
        .from("shopping_list")
        .select("*", { count: "exact", head: true })
        .eq("checked", false)
        .eq("household_id", householdId);

      setShoppingCount(count || 0);
    };

    fetchShoppingCount();
  }, []);

  const baseCategories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const getCount = (cat: string) => {
    if (cat === "Favorieten") return favorites.length;
    if (cat === "Alles") return recipes.length;
    return recipes.filter(
      (r) => r.category?.toLowerCase() === cat.toLowerCase(),
    ).length;
  };

  const sortedCategories = baseCategories
    .map((cat) => ({ name: cat, count: getCount(cat) }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

  const finalFilters = [
    { name: "Alles", count: recipes.length },
    { name: "Favorieten", count: favorites.length },
    ...sortedCategories,
  ];

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

  const currentWeekOptionLabel =
    weekOptions.find((w) => w.offset === weekOffset)?.label ?? "Deze week";

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
      const householdId = await getHouseholdId();
      if (!householdId) return;

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });

      setRecipes(data || []);
    };
    fetchRecipes();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const userId = await getUserId();
      if (!userId) return;

      const { data } = await supabase
        .from("favorites")
        .select("recipe_id")
        .eq("user_id", userId);

      setFavorites(data?.map((f) => f.recipe_id) || []);
    };
    fetchFavorites();
  }, []);

  useEffect(() => {
    const fetchWeekPlan = async () => {
      const householdId = await getHouseholdId();
      if (!householdId) return;

      const { data } = await supabase
        .from("week_plans")
        .select("id, day_index, recipe_id, custom_name, recipes(*)")
        .eq("week_start", weekStartDate)
        .eq("household_id", householdId);

      const grouped: Record<number, DayItem[]> = {
        // ← dit was weg
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
      };

      data?.forEach((item: any) => {
        if (item.custom_name) {
          grouped[item.day_index].push({
            type: "custom",
            name: item.custom_name,
            id: item.id,
          });
        } else if (item.recipes) {
          grouped[item.day_index].push({ type: "recipe", data: item.recipes });
        }
      });

      setWeekPlan(grouped);
    };

    fetchWeekPlan();
  }, [weekStartDate]);

  const addCustomItem = async (dayIndex: number) => {
    if (!customInput.trim()) return;
    const householdId = await getHouseholdId();
    const userId = await getUserId();
    if (!householdId || !userId) return;

    const { data, error } = await supabase
      .from("week_plans")
      .insert({
        week_start: weekStartDate,
        day_index: dayIndex,
        custom_name: customInput.trim(),
        user_id: userId,
        household_id: householdId,
      })
      .select()
      .single();

    if (!error && data) {
      setWeekPlan((prev) => ({
        ...prev,
        [dayIndex]: [
          ...prev[dayIndex],
          { type: "custom", name: customInput.trim(), id: data.id },
        ],
      }));
      setCustomInput("");
      setCustomInputDay(null);
    }
  };

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
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeCategory === "Alles") return matchesSearch;
    if (activeCategory === "Favorieten")
      return matchesSearch && favorites.includes(recipe.id);
    const matchesCategory =
      recipe.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const toggleRecipeForDay = async (recipe: any) => {
    if (activeDay === null) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const exists = weekPlan[activeDay].some(
      (i) => i.type === "recipe" && i.data.id === recipe.id,
    );

    if (exists) {
      const householdId = await getHouseholdId();
      if (!householdId) return;

      const { error } = await supabase
        .from("week_plans")
        .delete()
        .eq("week_start", weekStartDate)
        .eq("day_index", activeDay)
        .eq("recipe_id", recipe.id)
        .eq("household_id", householdId);

      if (!error) {
        setWeekPlan((prev) => ({
          ...prev,
          [activeDay]: prev[activeDay].filter(
            (i) => !(i.type === "recipe" && i.data.id === recipe.id),
          ),
        }));
      }
    } else {
      const householdId = await getHouseholdId();
      if (!householdId) return;

      const { error } = await supabase.from("week_plans").insert({
        week_start: weekStartDate,
        day_index: activeDay,
        recipe_id: recipe.id,
        user_id: userId,
        household_id: householdId,
      });

      if (!error) {
        setWeekPlan((prev) => ({
          ...prev,
          [activeDay]: [...prev[activeDay], { type: "recipe", data: recipe }],
        }));
      }
    }
  };

  const removeFromDay = async (dayIndex: number, item: DayItem) => {
    const householdId = await getHouseholdId();
    if (!householdId) return;

    let query = supabase
      .from("week_plans")
      .delete()
      .eq("week_start", weekStartDate)
      .eq("day_index", dayIndex)
      .eq("household_id", householdId);

    if (item.type === "recipe") {
      query = query.eq("recipe_id", item.data.id);
    } else {
      query = query.eq("id", item.id);
    }

    const { error } = await query;
    if (!error) {
      setWeekPlan((prev) => ({
        ...prev,
        [dayIndex]: prev[dayIndex].filter((i) =>
          item.type === "recipe"
            ? !(i.type === "recipe" && i.data.id === item.data.id)
            : !(i.type === "custom" && i.id === item.id),
        ),
      }));
    }
  };

  const sheetBottomPadding = "calc(5rem + env(safe-area-inset-bottom))";

  // Gedeelde week + shopping bar — gebruikt in zowel de hero als de sticky header
  const WeekBar = ({ compact = false }: { compact?: boolean }) => (
    <div
      className={clsx(
        "flex items-center justify-between",
        compact ? "px-4" : "mt-3",
      )}
    >
      <button
        onClick={() => setIsWeekPickerOpen(true)}
        className={clsx(
          "flex items-center gap-2 transition-opacity active:opacity-70",
          compact ? "py-1" : "py-0",
        )}
      >
        <div className="text-left">
          {!compact && (
            <p className="text-sm font-normal text-[var(--color-text-secondary)] mb-0.5">
              {currentWeekOptionLabel}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                "text-[var(--color-text)]",
                compact ? "text-xs" : "text-xs",
              )}
            >
              {weekLabel}
            </span>
            <Icon
              icon={ChevronDown}
              size={14}
              className="text-[var(--color-text-secondary)]"
            />
          </div>
        </div>
      </button>

      <div className="relative">
        <button
          onClick={() => router.push(`/shopping?week=${weekStartDate}`)}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:opacity-70 transition-opacity"
        >
          <Icon
            icon={ShoppingBag}
            size={24}
            strokeWidth={1.5}
            className="text-[var(--color-text-secondary)]"
          />
        </button>
        {shoppingCount > 0 && (
          <div className="absolute -top-0.5 -right-0.5 h-4 px-1 bg-[var(--color-accent)] rounded-full flex items-center justify-center pointer-events-none">
            <span className="text-white text-[10px] font-bold leading-none">
              {shoppingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <main
        className="min-h-screen bg-[var(--color-bg)]"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Hero header */}
        <div
          className="px-4 sticky z-10 bg-[var(--color-bg)]/90 backdrop-blur-md pb-3 max-w-4xl mx-auto"
          style={{
            top: 0,
            paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          }}
        >
          <h1
            className={clsx(
              "font-bold text-[var(--color-text)] leading-tight tracking-tight transition-all duration-300",
              isScrolled ? "text-base mb-2" : "text-[2rem] mb-3",
            )}
          >
            Weekplanner
          </h1>
          <WeekBar />
        </div>

        {/* Dagkaarten */}
        <div className="px-4 max-w-4xl mx-auto space-y-4 pt-2">
          {weekData.map((day, index) => (
            <Card key={index} className="p-3 space-y-2">
              <div className="flex justify-between">
                <div>
                  <h2 className="capitalize font-semibold text-[var(--color-text)]">
                    {day.label}
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {day.shortDate}
                  </p>
                </div>

                <div className="flex items-start gap-2 w-[26px] justify-end relative mt-1.5">
                  <div
                    className={clsx(
                      "absolute right-7 flex items-center gap-3 whitespace-nowrap transition-all duration-200",
                      actionMenuDay === index
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-2 pointer-events-none",
                    )}
                  >
                    <button
                      onClick={() => {
                        setCustomInputDay(index);
                        setCustomInput("");
                        setActionMenuDay(null);
                      }}
                      className="text-xs text-[var(--color-accent)] whitespace-nowrap"
                    >
                      Zelf invullen
                    </button>

                    <button
                      onClick={() => {
                        setActiveDay(index);
                        setActionMenuDay(null);
                      }}
                      className="text-xs text-[var(--color-accent)] whitespace-nowrap"
                    >
                      Toevoegen
                    </button>
                  </div>

                  <button
                    onClick={() => toggleDayActions(index)}
                    className="flex items-center justify-center w-[20px] h-[20px] active:opacity-70 transition"
                  >
                    <Icon
                      icon={Plus}
                      size={20}
                      className={clsx(
                        "transition-transform duration-200",
                        actionMenuDay === index
                          ? "rotate-45 text-[var(--color-accent)]"
                          : "text-[var(--color-text)]",
                      )}
                    />
                  </button>
                </div>
              </div>

              {weekPlan[index].length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  Nog niets gepland
                </p>
              ) : (
                <div className="space-y-2">
                  {weekPlan[index].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm rounded-xl"
                    >
                      {item.type === "recipe" ? (
                        <Link
                          href={`/recipe/${item.data.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-[var(--color-surface-tertiary)] shrink-0">
                            {item.data.image_url && (
                              <img
                                src={item.data.image_url}
                                alt={item.data.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span className="text-[var(--color-text)] line-clamp-2">
                            {item.data.title}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <UtensilsCrossed
                              size={18}
                              className="text-gray-400"
                            />
                          </div>
                          <span className="text-[var(--color-text)]">
                            {item.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFromDay(index, item)}
                        className="ml-2 text-[var(--color-text-tertiary)] active:text-red-400 shrink-0 transition-colors"
                      >
                        <Icon icon={X} size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="w-full">
                {customInputDay === index && (
                  <div className="relative w-full">
                    <input
                      autoFocus
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addCustomItem(index);
                        if (e.key === "Escape") setCustomInputDay(null);
                      }}
                      placeholder="bijv. Aardappels met broccoli"
                      className="w-full text-sm px-4 py-2.5 pr-10 rounded-xl border border-gray-200 outline-none"
                      enterKeyHint="done"
                    />
                    {customInput.length > 0 && (
                      <button
                        onClick={() => setCustomInput("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Week picker sheet */}
      <SwipeableSheet
        open={isWeekPickerOpen}
        onClose={() => setIsWeekPickerOpen(false)}
        title="Bekijk periode"
        height="auto"
        maxHeight="90dvh"
      >
        <div
          className="px-4 space-y-1 pt-1"
          style={{ paddingBottom: sheetBottomPadding }}
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
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all",
                  isSelected
                    ? "border border-gray-200"
                    : "border border-transparent",
                )}
              >
                <div className="text-left">
                  <div
                    className={clsx(
                      "text-sm font-medium",
                      isSelected
                        ? "text-[var(--color-text-secondary)]"
                        : "text-gray-400",
                    )}
                  >
                    {option.label}
                  </div>
                  <div
                    className={clsx(
                      "text-xs mt-0.5",
                      isSelected ? "text-[var(--color-text)]" : "text-gray-400",
                    )}
                  >
                    {range}
                  </div>
                </div>
                <div
                  className={clsx(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "border-[var(--color-accent)]"
                      : "border-[var(--color-border)]",
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SwipeableSheet>

      {/* Recept picker sheet */}
      <SwipeableSheet
        open={activeDay !== null}
        onClose={() => setActiveDay(null)}
        title="Kies een recept"
        height="auto"
        maxHeight="70dvh"
      >
        <div className="px-6 mb-4 shrink-0">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Zoek recept..."
          />
        </div>

        <div
          className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth mb-4 shrink-0"
          style={{
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            scrollPaddingLeft: "1.5rem",
          }}
        >
          {finalFilters.map((item) => {
            const isActive = activeCategory === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveCategory(item.name)}
                className={clsx(
                  "snap-start flex-shrink-0 px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition font-medium",
                  isActive
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-200",
                )}
              >
                {item.name}
                <span
                  className={clsx(
                    "ml-2 text-xs",
                    isActive ? "opacity-60" : "opacity-40",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 space-y-2"
          style={{ paddingBottom: sheetBottomPadding }}
        >
          {filteredRecipes.length === 0 ? (
            <div className="text-sm text-[var(--color-text-tertiary)] py-6 text-center">
              Geen recepten gevonden
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const isSelected =
                activeDay !== null &&
                weekPlan[activeDay].some(
                  (i) => i.type === "recipe" && i.data.id === recipe.id,
                );

              return (
                <button
                  key={recipe.id}
                  onClick={() => toggleRecipeForDay(recipe)}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition",
                    isSelected
                      ? "border border-gray-200"
                      : "border border-transparent",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-[var(--color-surface-tertiary)] shrink-0">
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-sm text-left truncate max-w-[200px] text-[var(--color-text)]">
                      {recipe.title}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                      isSelected
                        ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                        : "border-[var(--color-border)] bg-transparent",
                    )}
                  >
                    {isSelected && (
                      <Icon icon={Check} size={16} className="text-white" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </SwipeableSheet>
    </>
  );
}
