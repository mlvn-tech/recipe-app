"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function CookMode() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [recipe, setRecipe] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="p-8">Laden...</p>;
  if (!recipe) return <p className="p-8">Recept niet gevonden.</p>;

  const totalSteps = recipe.steps?.length || 0;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // 🔹 Titel formatteren
  const formattedTitle =
    recipe.title.charAt(0).toUpperCase() + recipe.title.slice(1).toLowerCase();

  return (
    <main className="h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[var(--color-bg)] px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push(`/recipe/${id}`)}
            className="text-gray-500 text-xl"
          >
            ✕
          </button>

          <h1 className="text-base font-semibold truncate max-w-[200px] text-center">
            {formattedTitle}
          </h1>

          <div className="w-6" />
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-brand)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scrollable Steps */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-4">
        {recipe.steps.map((step: string, index: number) => {
          const isActive = index === currentStep;

          return (
            <div
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`
                cursor-pointer
                p-6
                rounded-2xl
                transition-all
                duration-200
                ${
                  isActive
                    ? "bg-gray-100 text-gray-900 shadow-sm"
                    : "text-gray-400"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`font-semibold ${
                    isActive ? "text-gray-900" : "text-gray-300"
                  }`}
                >
                  {index + 1}.
                </span>

                <p
                  className={
                    isActive ? "text-lg leading-relaxed" : "leading-relaxed"
                  }
                >
                  {step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
