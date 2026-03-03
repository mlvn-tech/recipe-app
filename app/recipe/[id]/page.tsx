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
  PlayCircleIcon,
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Icon from "@/components/icons";
import { CookingPot, PlayCircle, PlayIcon } from "lucide-react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import SwipeableSheet from "@/components/SwipeableSheet";
import { formatTitle } from "@/lib/utils";

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

  // ✅ FAVORITES STATE
  const [isFavorite, setIsFavorite] = useState(false);
  const [burst, setBurst] = useState(false);

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

  // ✅ FAVORITES CHECK
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

  // ✅ FAVORITES TOGGLE
  const toggleFavorite = async () => {
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
      await supabase.from("favorites").insert({
        user_id: user.id,
        recipe_id: id,
      });

      setIsFavorite(true);
    }
  };

  useEffect(() => {
    if (!titleRef.current || !recipe) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderTitle("Recept");
        } else {
          setHeaderTitle(formatTitle(recipe.title));
        }
      },
      { threshold: 0, rootMargin: "-70px 0px 0px 0px" },
    );

    observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, [recipe]);

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

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [recipe]);

  if (loading) return <p className="p-8">Laden...</p>;
  if (!recipe) return <p className="p-8">Recept niet gevonden.</p>;

  const formattedDate = new Date(recipe.created_at).toLocaleDateString(
    "nl-NL",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
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

      <main className="min-h-dvh bg-[var(--color-bg)] pt-16 pb-32">
        {recipe.image_url && (
          <div className="relative w-full h-72">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />

            {/* ❤️ FAVORITE BUTTON */}
            <button
              onClick={() => {
                if (!isFavorite) {
                  setBurst(true);
                  setTimeout(() => setBurst(false), 500);
                }
                toggleFavorite();
              }}
              className="
    absolute bottom-4 right-4
    bg-white/80 backdrop-blur-md
    rounded-full p-3
    shadow-md
    relative
    flex items-center justify-center
  "
            >
              {/* Hart icoon */}
              <Icon
                icon={isFavorite ? HeartSolid : HeartOutline}
                className={`${
                  isFavorite ? "text-[var(--color-accent)]" : "text-gray-500"
                } transition`}
              />

              {/* 💚 Subtiele burst */}
              {burst && (
                <div className="absolute inset-0 pointer-events-none">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="heart-particle"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>
        )}

        <div className="px-4 pt-4 pb-16 space-y-4 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 tracking-wide py-2">
              Toegevoegd op {formattedDate}
            </p>
            <h1 ref={titleRef} className="text-3xl font-bold">
              {formatTitle(recipe.title)}
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
                      <h3 className="font-semibold text-gray-400 tracking-tight">
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
              <h2 className="font-semibold text-lg leading-none">Bereiding</h2>
              <button
                onClick={() => router.push(`/recipe/${recipe.id}/cook`)}
                className="flex items-center gap-2 text-sm text-[var(--color-accent)] font-medium"
              >
                <PlayCircle size={22} />
                Start met koken
              </button>
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
      </main>

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
          className="px-8 max-h-[65dvh]"
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
          className={clsx(styles.button.floatingFrosted, "px-6 py-5")}
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
