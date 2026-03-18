"use client";

import { useState } from "react";
import { styles } from "@/lib/styles";
import clsx from "clsx";
import { ChevronDown, X, WandSparkles } from "lucide-react";
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
        headers: { "Content-Type": "application/json" },
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
      {/* ── Header ── */}
      <div
        className="fixed top-0 left-0 right-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-gray-100"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
          paddingBottom: "0.75rem",
        }}
      >
        <div className="relative flex items-center justify-center px-4 max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="absolute left-4 text-[var(--color-text-secondary)] active:opacity-70 transition-opacity p-1 -ml-1"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-[var(--color-text)] leading-tight tracking-tight text-base">
            Koken met AI
          </h2>
        </div>
      </div>

      <main
        className="min-h-dvh bg-[var(--color-bg)] pb-32"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.5rem)" }}
      >
        <div className="max-w-4xl mx-auto px-4 space-y-4 pt-4">
          {/* Illustratie + intro */}
          <div className="flex flex-col items-center pt-4 pb-2 gap-3">
            <img
              src="/ai-cooking.png"
              alt="AI cooking"
              className="w-28 h-auto"
            />
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Wat heb je nog in huis?
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Vul je ingrediënten in en wij doen de rest
              </p>
            </div>
          </div>

          {/* Input card */}
          <Card className="p-5 space-y-4">
            {/* Ingrediënten */}
            <div>
              <label className={clsx(styles.label.default, "mb-2")}>
                Ingrediënten
              </label>
              <textarea
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                placeholder="Bijv: paprika, ui, zoete aardappel, rijst"
                rows={4}
                disabled={generating}
                className={clsx(
                  styles.input.default,
                  generating && "opacity-60 cursor-not-allowed",
                )}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Scheid ingrediënten met een komma
              </p>
            </div>

            {/* Porties + Categorie */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-16">
                <label className={styles.label.default}>Porties</label>
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

              <div className="flex flex-col gap-2 flex-1">
                <label className={styles.label.default}>Categorie</label>
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
              disabled={generating || !ingredientInput.trim()}
              className={clsx(
                styles.button.aigenerate,
                "w-full mt-2",
                (generating || !ingredientInput.trim()) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <WandSparkles size={18} className="animate-pulse" />
                  Recept wordt gegenereerd…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <WandSparkles size={18} />
                  Genereer recept
                </span>
              )}
            </button>
          </Card>
        </div>
      </main>
    </>
  );
}
