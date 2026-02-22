"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import {
  UserIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ClockIcon,
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
  const [showSticky, setShowSticky] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("Recept");

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ingredientsEndRef = useRef<HTMLDivElement | null>(null);

  // Recept ophalen
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

  // Header titel verandert bij scroll
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

  // Sticky ingrediënten NA ingrediëntenkaart
  useEffect(() => {
    const handleScroll = () => {
      if (!ingredientsEndRef.current) return;

      const rect = ingredientsEndRef.current.getBoundingClientRect();
      const headerHeight = 72;

      if (rect.bottom <= headerHeight) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      {/* Header */}
      <Header
        title={headerTitle}
        onBack={() => router.replace("/")}
        rightContent={
          <button onClick={() => router.push(`/recipe/${recipe.id}/edit`)}>
            <Icon icon={PencilSquareIcon} className="text-white/80" />
          </button>
        }
      />

      {/* Sticky ingrediënten */}
      <div
        className={`
          fixed top-[64px] left-0 w-full z-40 px-4
          transition-all duration-300 ease-in-out
          ${
            showSticky
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-3 pointer-events-none"
          }
        `}
      >
        <div className="bg-white/70 backdrop-blur-lg rounded-b-md border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <button
            onClick={() => setIngredientsOpen(!ingredientsOpen)}
            className="w-full px-4 py-3 flex justify-between font-semibold"
          >
            Ingrediënten
            <Icon
              icon={ChevronDownIcon}
              className={`text-[var(--color-accent)] transition-transform duration-300 ${
                ingredientsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`
              grid transition-all duration-300 ease-in-out
              ${
                ingredientsOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }
            `}
          >
            <div className="overflow-hidden">
              <div className="px-6 pb-6 pt-2">
                <ul className="space-y-3">
                  {recipe.ingredients?.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero image direct onder header */}
      {recipe.image_url && (
        <div className="w-full h-72 mt-16">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4 pb-16 space-y-4">
        {/* Titel + meta */}
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
              <span className="px-3 py-1 border border-gray-300 rounded-md capitalize">
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
                <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
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

        {/* Notities kaart */}
        {recipe.notes && (
          <Card>
            <h2 className="font-semibold mb-4 text-lg">Notities</h2>
            <p className="whitespace-pre-line">{recipe.notes}</p>
          </Card>
        )}
      </div>
    </main>
  );
}
