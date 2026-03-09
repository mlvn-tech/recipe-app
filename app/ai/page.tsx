"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { RefreshCw, ChevronDown } from "lucide-react";

import Icon from "@/components/icons";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";

export default function AIPage() {
  const router = useRouter();

  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!ingredientInput.trim()) return;

    try {
      setGenerating(true);

      const ingredientArray = ingredientInput
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: ingredientArray,
          servings: selectedServings,
          category: selectedCategory,
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return;
      }

      if (!data.error) {
        localStorage.setItem("ai_preview", JSON.stringify(data));
        router.push("/recipe/preview");
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Header title="Koken met AI" showBack={false} />

      <main
        className="min-h-dvh bg-[var(--color-bg)]"
        style={{ paddingTop: "var(--header-height)" }}
      >
        <div className="max-w-4xl mx-auto px-4 space-y-6 pt-4">
          {/* AI illustratie */}
          <div className="flex justify-center">
            <img
              src="/ai-cooking.png"
              alt="AI cooking"
              className="w-30 h-auto"
            />
          </div>

          <Card className="space-y-5">
            {/* Intro */}
            <div className="space-y-2 text-center mb-6">
              <h2 className="text-lg font-semibold">Wat heb je nog in huis?</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Vul jouw ingrediënten in en wij doen de rest
              </p>
            </div>

            {/* Ingrediënten */}
            <textarea
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              placeholder="Bijv: paprika, ui, zoete aardappel, rijst"
              rows={4}
              disabled={generating}
              className={clsx(
                styles.input.default,
                "transition-all duration-200",
                generating && "opacity-60 bg-gray-50 cursor-not-allowed",
              )}
            />

            {/* Porties + Categorie */}
            <div className="flex gap-4 mt-4">
              {/* Porties */}
              <div className="flex flex-col gap-2 w-16">
                <label className="text-sm font-medium">Porties</label>

                <div className="relative">
                  <select
                    value={selectedServings}
                    onChange={(e) =>
                      setSelectedServings(Number(e.target.value))
                    }
                    className={clsx(
                      styles.dropdown.trigger,
                      "appearance-none cursor-pointer text-center",
                    )}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>

                  <Icon
                    icon={ChevronDown}
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Categorie */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-medium">Categorie</label>

                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={clsx(
                      styles.dropdown.trigger,
                      "appearance-none cursor-pointer",
                    )}
                  >
                    {["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"].map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ),
                    )}
                  </select>

                  <Icon
                    icon={ChevronDown}
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Generate knop */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={clsx(
                styles.button.primary,
                "h-[58px] mt-6 relative flex items-center justify-center mx-auto transition-all duration-300",
                generating
                  ? "w-[58px] !px-0 bg-[var(--color-secondaccent)]"
                  : "w-full",
              )}
            >
              {!generating && <span className="absolute">Genereer recept</span>}

              {generating && (
                <RefreshCw className="w-6 h-6 animate-spin absolute text-white" />
              )}
            </button>
          </Card>
        </div>
      </main>
    </>
  );
}
