"use client";
import clsx from "clsx";
import { styles } from "@/lib/styles";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  User,
  PenSquare,
  ChevronDown,
  ChevronLeft,
  Clock,
  Share,
  Heart,
  PlayCircle,
  WandSparkles,
  CalendarPlus,
  Plus,
  Check,
  List,
} from "lucide-react";

import Icon from "@/components/icons";
import Card from "@/components/Card";
import SwipeableSheet from "@/components/SwipeableSheet";
import { formatTitle } from "@/lib/utils";
import { useUI } from "@/components/UIContext";

export default function RecipeDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const params = useParams();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const handleBack = () => {
    switch (from) {
      case "week":
        router.replace("/week");
        break;
      case "cook":
        router.replace("/cook");
        break;
      case "home":
      default:
        router.replace("/");
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFloating, setShowFloating] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const { createMenuOpen } = useUI();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);

  const [plannedDays, setPlannedDays] = useState<number[]>([]);
  const [weekPlan, setWeekPlan] = useState<Record<number, any[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });

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
        index: i,
      };
    });
  }, [baseDate]);

  const handlePlanDay = async (dayIndex: number) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId || !recipe) return;

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle();

    const householdId = membership?.household_id;
    if (!householdId) return;

    const alreadyPlanned = plannedDays.includes(dayIndex);

    if (alreadyPlanned) {
      const { error } = await supabase
        .from("week_plans")
        .delete()
        .eq("week_start", weekStartDate)
        .eq("day_index", dayIndex)
        .eq("recipe_id", recipe.id)
        .eq("household_id", householdId);

      if (!error) {
        setWeekPlan((prev) => ({
          ...prev,
          [dayIndex]: prev[dayIndex].filter((r) => r.id !== recipe.id),
        }));
        setPlannedDays((prev) => prev.filter((d) => d !== dayIndex));
      }
    } else {
      const { error } = await supabase.from("week_plans").insert({
        week_start: weekStartDate,
        day_index: dayIndex,
        recipe_id: recipe.id,
        user_id: userId,
        household_id: householdId,
      });

      if (!error) {
        setWeekPlan((prev) => ({
          ...prev,
          [dayIndex]: [...prev[dayIndex], recipe],
        }));
        setPlannedDays((prev) => [...prev, dayIndex]);
      }
    }
  };

  const [isFavorite, setIsFavorite] = useState(false);
  const [animating, setAnimating] = useState(false);

  const ingredientsEndRef = useRef<HTMLDivElement | null>(null);
  const heroEndRef = useRef<HTMLDivElement | null>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  // Scroll detectie voor sticky header (voorbij heroEndRef)
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!heroEndRef.current || !metaRef.current) return;

      const heroRect = heroEndRef.current.getBoundingClientRect();
      const metaRect = metaRef.current.getBoundingClientRect();
      const scrollingUp = window.scrollY < lastScrollY;
      lastScrollY = window.scrollY;

      if (heroRect.top <= 0) {
        // Voorbij de foto
        if (scrollingUp && metaRect.bottom > 80) {
          // Scrollt omhoog en metadata is weer zichtbaar → verberg
          setIsScrolled(false);
        } else if (!scrollingUp) {
          // Scrollt omlaag → altijd tonen
          setIsScrolled(true);
        }
      } else {
        // Nog bij de foto → altijd verbergen
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll detectie voor ingrediënten knop
  useEffect(() => {
    const handleScroll = () => {
      if (!ingredientsEndRef.current) return;
      const rect = ingredientsEndRef.current.getBoundingClientRect();
      if (rect.bottom <= 64) {
        setShowFloating(true);
      } else {
        setShowFloating(false);
        setIngredientsOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [recipe]);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();
      setRecipe(data);
      setLoading(false);
    };
    if (id) fetchRecipe();
  }, [id]);

  useEffect(() => {
    const checkFavorite = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !id) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_id", id)
        .maybeSingle();
      setIsFavorite(!!data);
    };
    if (id) checkFavorite();
  }, [id]);

  const toggleFavorite = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !id) return;
    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_id", id);
      setIsFavorite(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, recipe_id: id });
      setIsFavorite(true);
    }
  };

  const handleShare = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !id) return;

    const { data: existing } = await supabase
      .from("shared_recipes")
      .select("token")
      .eq("recipe_id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    let token = existing?.token;

    if (!token) {
      const { data: created } = await supabase
        .from("shared_recipes")
        .insert({ recipe_id: id, created_by: user.id })
        .select("token")
        .single();
      token = created?.token;
    }

    if (!token) return;
    const url = `${window.location.origin}/recipe/share/${token}`;
    if (navigator.share) {
      await navigator.share({ title: recipe.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link gekopieerd!");
    }
  };

  useEffect(() => {
    const fetchWeekPlan = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .maybeSingle();

      const householdId = membership?.household_id;
      if (!householdId) return;

      const { data } = await supabase
        .from("week_plans")
        .select("day_index, recipes(*)")
        .eq("week_start", weekStartDate)
        .eq("household_id", householdId);

      const grouped: Record<number, any[]> = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [],
      };
      const planned: number[] = [];

      data?.forEach((item: any) => {
        if (item.recipes) {
          grouped[item.day_index].push(item.recipes);
          if (item.recipes.id === recipe?.id) planned.push(item.day_index);
        }
      });

      setWeekPlan(grouped);
      setPlannedDays(planned);
    };
    fetchWeekPlan();
  }, [weekStartDate, recipe]);

  const weekLabel = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} t/m ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
  }, [baseDate]);

  const weekOptions = [
    { label: "Deze week", offset: 0 },
    { label: "Volgende week", offset: 1 },
    { label: "Over 2 weken", offset: 2 },
    { label: "Over 3 weken", offset: 3 },
  ];

  return (
    <>
      <main className="min-h-screen bg-[var(--color-bg)] pb-12">
        {loading ? (
          <div className="px-4 pt-4 space-y-4">
            <div className="h-72 bg-gray-200 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        ) : !recipe ? (
          <p className="p-8">Recept niet gevonden.</p>
        ) : (
          <>
            {/* Hero afbeelding */}
            {recipe.image_url && (
              <div className="relative w-full h-[52vh]">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
                {/* Terugknop over de afbeelding */}
                <button
                  onClick={handleBack}
                  className={clsx(
                    "fixed z-30 p-2 transition-all duration-300",
                    isScrolled
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100",
                  )}
                  style={{
                    top: "calc(env(safe-area-inset-top) + 12px)",
                    left: "0.5rem",
                  }}
                >
                  <Icon
                    icon={ChevronLeft}
                    size={32}
                    strokeWidth={1.5}
                    className="text-white"
                  />
                </button>

                {/* Favoriet knop over de afbeelding */}
                <button
                  onClick={toggleFavorite}
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md rounded-full p-2 shadow-md"
                >
                  <Icon
                    icon={Heart}
                    size={28}
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
            <div ref={heroEndRef} className="" />
            {/* Sticky header */}
            <div className="sticky top-0 z-20 h-0 overflow-visible">
              <div
                className={clsx(
                  "px-4 bg-[var(--color-bg)]/90 backdrop-blur-md transition-all duration-300",
                  isScrolled
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none",
                )}
                style={{
                  paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
                  paddingBottom: "0.75rem",
                }}
              >
                {/* Chevron + terug */}
                <div className="flex items-center gap-1 -ml-1">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 -ml-1 text-[var(--color-text-secondary)] active:opacity-70 transition-opacity"
                  >
                    <Icon icon={ChevronLeft} size={20} />
                    <span className="text-sm">Recepten</span>
                  </button>
                </div>

                {/* Titel + icoontjes */}
                <div className="flex items-center justify-between mt-0.5">
                  <h2 className="font-bold text-[var(--color-text)] leading-tight tracking-tight transition-all duration-300 text-base mb-2 mr-2">
                    {formatTitle(recipe.title)}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600 shrink-0">
                    <button
                      onClick={() => setIngredientsOpen(true)}
                      className={clsx(
                        "active:opacity-70 transition-all duration-300",
                        showFloating
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-2 pointer-events-none",
                      )}
                    >
                      <Icon icon={List} size={24} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setPlannerOpen(true)}>
                      <Icon icon={CalendarPlus} size={24} strokeWidth={1.5} />
                    </button>
                    <button onClick={toggleFavorite}>
                      <Icon
                        icon={Heart}
                        size={24}
                        strokeWidth={1.5}
                        className={
                          isFavorite
                            ? "text-[var(--color-accent)] fill-[var(--color-accent)]"
                            : "text-gray-600"
                        }
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-16 space-y-4">
              <div className="flex flex-col items-center px-2 space-y-7">
                <h1 className="pt-8 text-3xl text-center font-bold leading-tight">
                  {formatTitle(recipe.title)}
                </h1>

                <div className="flex items-center gap-6 text-md text-[var(--color-text-secondary)]">
                  {recipe.cooking_time && (
                    <div className="flex items-center gap-1">
                      <Icon icon={Clock} size={20} />
                      <span>{recipe.cooking_time} minuten</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center gap-1">
                      <Icon icon={User} size={20} />
                      <span>{recipe.servings} personen</span>
                    </div>
                  )}
                </div>

                {(recipe.is_ai || recipe.category) && (
                  <div className="flex gap-2">
                    {recipe.category && (
                      <div className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 text-sm capitalize">
                        {recipe.category}
                      </div>
                    )}
                    {recipe.is_ai && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-lg border border-[rgb(var(--color-secondaccent)/0.40)] text-[rgb(var(--color-secondaccent))] text-xs">
                        <Icon icon={WandSparkles} size={14} />
                        AI gegenereerd
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-6 mb-8">
                  <button
                    onClick={handleShare}
                    className="text-[var(--color-text-secondary)] active:scale-90 transition"
                  >
                    <Share size={24} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => router.push(`/recipe/${recipe.id}/edit`)}
                    className="text-[var(--color-text-secondary)] active:scale-90 transition"
                  >
                    <PenSquare size={24} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setPlannerOpen(true)}
                    className="text-[var(--color-text-secondary)] active:scale-90 transition"
                  >
                    <CalendarPlus size={24} strokeWidth={1.5} />
                  </button>
                </div>
                <div ref={metaRef}></div>
              </div>

              <Card>
                <h2 className="font-semibold mb-4 text-lg">Ingrediënten</h2>
                <ul className="space-y-3">
                  {recipe.ingredients?.map((item: string, index: number) => {
                    const trimmed = item.trim();
                    const isTitle = trimmed.startsWith("#");
                    if (isTitle) {
                      return (
                        <li key={index} className="pt-2">
                          {index !== 0 && (
                            <div className="border-t border-gray-100 mb-4" />
                          )}
                          <h3 className="font-semibold text-[#6B7280] tracking-tight">
                            {trimmed.replace(/^#\s*/, "")}
                          </h3>
                        </li>
                      );
                    }
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <span className="mt-2.5 h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                        <span>{trimmed.replace(/^-\s*/, "")}</span>
                      </li>
                    );
                  })}
                </ul>
                <div ref={ingredientsEndRef} className="h-1" />
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg leading-none">
                    Bereiding
                  </h2>
                </div>
                <ol className="space-y-0">
                  {recipe.steps?.map((step: string, index: number) => (
                    <li
                      key={index}
                      className="flex gap-1 py-4 border-b border-gray-100 last:border-none"
                    >
                      <span className="text-gray-400 font-semibold min-w-[24px]">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              {recipe.notes && (
                <Card>
                  <h2 className="font-semibold mb-4 text-lg min-h-[30px]">
                    Notities
                  </h2>
                  <p className="whitespace-pre-line">{recipe.notes}</p>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Floating cook button */}
        <div
          className="fixed bottom-0 left-0 right-0 flex justify-center p-4 pointer-events-none"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
          }}
        >
          <button
            onClick={() => router.push(`/recipe/${recipe.id}/cook`)}
            className={clsx(
              styles.button.primary,
              "text-xs !px-4 !py-3 flex items-center justify-center gap-2 pointer-events-auto transition-all duration-300",
              isScrolled
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none",
            )}
          >
            <PlayCircle size={24} strokeWidth={1.5} />
            Start met koken
          </button>
        </div>
      </main>

      {/* Ingrediënten sheet */}
      {recipe && (
        <SwipeableSheet
          open={ingredientsOpen && showFloating}
          onClose={() => setIngredientsOpen(false)}
          title="Ingrediënten"
          height="auto"
          maxHeight="60dvh"
          overflowVisible={false}
          overlay={false}
        >
          <div
            className="px-6 space-y-3 pt-2"
            style={{
              paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
            }}
          >
            <ul className="space-y-3">
              {recipe.ingredients?.map((item: string, index: number) => {
                const trimmed = item.trim();
                const isTitle = trimmed.startsWith("#");
                if (isTitle) {
                  return (
                    <li
                      key={index}
                      className="pt-4 pb-1 font-semibold text-gray-900"
                    >
                      {trimmed.replace(/^#\s*/, "")}
                    </li>
                  );
                }
                return (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                    <span>{trimmed.replace(/^-\s*/, "")}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </SwipeableSheet>
      )}

      {/* Planner sheet */}
      <SwipeableSheet
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        title="Plan in week"
        height="auto"
        maxHeight="90dvh"
      >
        <div
          className="px-4 space-y-2 pt-2"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {/* Week picker */}
          <div className="relative mb-3">
            <button
              onClick={() => setIsWeekPickerOpen((prev) => !prev)}
              className="w-full flex items-center justify-between"
            >
              <span className="px-4 text-sm text-[var(--color-text-secondary)] font-semibold">
                {weekLabel}
              </span>
              <div className="ml-auto flex items-center px-4 gap-1 text-sm text-[var(--color-text-secondary)] font-semibold">
                {weekOptions.find((w) => w.offset === weekOffset)?.label ??
                  "Deze week"}
                <Icon
                  icon={ChevronDown}
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${isWeekPickerOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isWeekPickerOpen && (
              <div className="absolute top-8 left-0 right-0 bg-white rounded-3xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                {weekOptions.map((option) => {
                  const start = new Date();
                  start.setDate(start.getDate() + option.offset * 7);
                  start.setDate(start.getDate() - start.getDay() + 1);
                  const end = new Date(start);
                  end.setDate(start.getDate() + 6);
                  const range = `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
                  const isSelected = weekOffset === option.offset;
                  return (
                    <button
                      key={option.offset}
                      onClick={() => {
                        setWeekOffset(option.offset);
                        setIsWeekPickerOpen(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 text-sm transition",
                        isSelected ? "bg-gray-50" : "hover:bg-gray-50",
                      )}
                    >
                      <div className="text-left">
                        <div
                          className={
                            isSelected
                              ? "font-medium text-gray-900"
                              : "text-gray-700"
                          }
                        >
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-400">{range}</div>
                      </div>
                      <div
                        className={clsx(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "border-[var(--color-accent)]"
                            : "border-gray-300",
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
            )}
          </div>

          {/* Dag knoppen */}
          {weekData.map((day) => {
            const recipesForDay = weekPlan[day.index] || [];
            return (
              <button
                key={day.index}
                onClick={() => handlePlanDay(day.index)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-3xl bg-gray-50 hover:bg-gray-100 transition-all duration-300"
              >
                <div className="flex flex-col text-left min-w-0 overflow-hidden transition-all duration-300">
                  <span className="text-[var(--color-text-secondary)] capitalize text-sm font-medium">
                    {day.label}
                  </span>
                  <div
                    className={clsx(
                      "overflow-hidden transition-all duration-300",
                      recipesForDay.length > 0
                        ? "max-h-12 opacity-100 mt-1"
                        : "max-h-0 opacity-0",
                    )}
                  >
                    <span className="text-xs text-gray-800 truncate max-w-[220px] block">
                      {recipesForDay.map((r: any) => r.title).join(", ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center shrink-0">
                  <div
                    style={{
                      transform: plannedDays.includes(day.index)
                        ? "scale(1) rotate(360deg)"
                        : "scale(1) rotate(270deg)",
                      transition: "transform 0.3s ease, color 0.2s ease",
                    }}
                    className="text-[var(--color-accent)]"
                  >
                    <Icon
                      icon={plannedDays.includes(day.index) ? Check : Plus}
                      size={16}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SwipeableSheet>
    </>
  );
}
