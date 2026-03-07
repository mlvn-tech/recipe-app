"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatTitle } from "@/lib/utils";
import Card from "@/components/Card";
import {
  ClockIcon,
  UserIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";

import { styles } from "@/lib/styles";
import clsx from "clsx";

export default function SharedRecipePage() {
  const { token } = useParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSharedRecipe = async () => {
      const { data: shared } = await supabase
        .from("shared_recipes")
        .select("recipe_id")
        .eq("token", token)
        .maybeSingle();

      if (!shared) {
        setError(true);
        setLoading(false);
        return;
      }

      const { data: recipe } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", shared.recipe_id)
        .single();

      setRecipe(recipe);
      setLoading(false);
    };

    if (token) fetchSharedRecipe();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      setSaving(false);
      return;
    }

    await supabase.from("recipes").insert({
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      notes: recipe.notes,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      category: recipe.category,
      image_url: recipe.image_url,
      household_id: membership.household_id,
      user_id: user.id,
    });

    setSaving(false);
    setSaved(true);
  };

  if (loading) return <p className="p-8">Laden...</p>;
  if (error || !recipe)
    return <p className="p-8">Recept niet gevonden of link is verlopen.</p>;

  return (
    <>
      <Header title="Gedeeld recept" />
      <main className="min-h-dvh bg-[var(--color-bg)] pb-32">
        {recipe.image_url && (
          <div className="relative w-full h-72">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-4 pt-4 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{formatTitle(recipe.title)}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
              {recipe.cooking_time && (
                <div className="flex items-center gap-1">
                  <Icon icon={ClockIcon} size={18} />
                  <span>{recipe.cooking_time} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Icon icon={UserIcon} size={18} />
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
                      <h3 className="font-semibold text-gray-400">
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
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-4">Bereiding</h2>
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

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={styles.button.save}
        >
          {saved
            ? "Opgeslagen!"
            : saving
              ? "Opslaan..."
              : "Voeg toe aan mijn recepten"}
        </button>
      </div>
    </>
  );
}
