"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import {
  UserIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import Header from "@/components/Header";
import Card from "@/components/Card";

export default function RecipeDetail() {
  const params = useParams();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const router = useRouter();

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFloating, setShowFloating] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("Recept");

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ingredientsEndRef = useRef<HTMLDivElement | null>(null);

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
    if (!titleRef.current || !recipe) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderTitle("Recept");
        } else {
          setHeaderTitle(recipe.title);
        }
      },
      {
        threshold: 0,
        rootMargin: "-70px 0px 0px 0px",
      },
    );

    observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, [recipe]);

  // Floating knop verschijnt zodra ingrediëntenkaart uit beeld scrollt
  useEffect(() => {
    const handleScroll = () => {
      if (!ingredientsEndRef.current) return;
      const rect = ingredientsEndRef.current.getBoundingClientRect();
      const headerHeight = 64;

      if (rect.bottom <= headerHeight) {
        setShowFloating(true);
      } else {
        setShowFloating(false);
        setIngredientsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [recipe]);

  if (loading) return <p className="p-8">Laden...</p>;
  if (!recipe) return <p className="p-8">Recept niet gevonden.</p>;

  const formattedDate = new Date(recipe.created_at).toLocaleDateString(
    "nl-NL",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <>
      <Header
        title={headerTitle}
        onBack={() => router.replace("/")}
        rightContent={
          <button onClick={() => router.push(`/recipe/${recipe.id}/edit`)}>
            <Icon icon={PencilSquareIcon} className="text-white/80" />
          </button>
        }
      />

      <main className="min-h-screen bg-[var(--color-bg)] pt-16 pb-24">
        {/* Hero image */}
        {recipe.image_url && (
          <div className="w-full h-72">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="px-4 pt-4 pb-16 space-y-4 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 tracking-wide py-2">
              Toegevoegd op {formattedDate}
            </p>

            <h1 ref={titleRef} className="text-3xl font-bold">
              {recipe.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
              {recipe.cooking_time && (
                <div className="flex items-center gap-1">
                  <Icon icon={ClockIcon} size={18} className="text-gray-500" />
                  <span>{recipe.cooking_time} min</span>
                </div>
              )}

              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Icon icon={UserIcon} size={18} className="text-gray-500" />
                  <span>
                    {recipe.servings}{" "}
                    {recipe.servings === 1 ? "persoon" : "personen"}
                  </span>
                </div>
              )}

              {recipe.category && (
                <span className="px-3 py-1 border border-gray-300 rounded-lg capitalize">
                  {recipe.category}
                </span>
              )}
            </div>
          </div>

          {/* Ingrediënten kaart */}
          <Card>
            <h2 className="font-semibold mb-4 text-lg">Ingrediënten</h2>
            <ul className="space-y-3">
              {recipe.ingredients?.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-xl bg-gray-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div ref={ingredientsEndRef} className="h-1" />
          </Card>

          {/* Bereiding kaart */}
          <Card>
            <h2 className="font-semibold mb-4 text-lg">Bereiding</h2>
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
              <h2 className="font-semibold mb-4 text-lg">Notities</h2>
              <p className="whitespace-pre-line">{recipe.notes}</p>
            </Card>
          )}
        </div>
      </main>

      {/* Transparante overlay om paneel te sluiten */}
      {ingredientsOpen && showFloating && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIngredientsOpen(false)}
        />
      )}

      {/* Ingrediënten paneel */}
      <div
        className={`fixed left-0 w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out z-30 ${
          ingredientsOpen && showFloating ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ bottom: 0, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 mb-4">
          <button onClick={() => setIngredientsOpen(false)}>
            <Icon icon={XMarkIcon} size={20} className="text-gray-400" />
          </button>
          <h3 className="font-semibold">Ingrediënten</h3>
          <div className="w-5" />
        </div>

        <div
          className="px-8 overflow-y-auto max-h-80"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          <ul className="space-y-3">
            {recipe?.ingredients?.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="mt-2 h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Floating pill knop */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          showFloating && !ingredientsOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => setIngredientsOpen(!ingredientsOpen)}
          className={clsx(styles.button.floatingFrosted, "px-5 py-3")}
        >
          Ingrediënten
          <Icon
            icon={ChevronDownIcon}
            size={16}
            className={`text-gray-400 transition-transform duration-300 ${
              ingredientsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </>
  );
}
