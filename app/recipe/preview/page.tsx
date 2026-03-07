"use client";

import Header from "@/components/Header";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import Card from "@/components/Card";
import { styles } from "@/lib/styles";
import { formatTitle } from "@/lib/utils";

type AIRecipe = {
  title: string;
  ingredients: string[];
  steps: string[];
  cooking_time: number;
  servings: number;
  category: string;
  originalIngredients?: string[];
};

export default function PreviewPage() {
  const router = useRouter();

  const [preview, setPreview] = useState<AIRecipe | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savingOverlay, setSavingOverlay] = useState(false);

  const [attempt, setAttempt] = useState(1);
  const maxAttempts = 3;

  // 🔥 Load preview uit localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ai_preview");

    if (!stored) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(stored);

    setPreview(parsed);

    // kleine delay zodat skeleton zichtbaar is
    const timer = setTimeout(() => {
      setAiLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [router]);
  if (aiLoading) {
    return (
      <>
        <Header title="Recept preview" />

        <main className="min-h-dvh bg-[var(--color-bg)] pt-20 pb-24 px-4">
          <div className="max-w-3xl mx-auto space-y-6 animate-pulse pt-4">
            {/* hero */}
            <div className="h-52 bg-gray-200 rounded-2xl" />

            {/* titel */}
            <div className="space-y-2">
              <div className="h-8 w-2/3 bg-gray-200 rounded" />

              <div className="flex gap-4">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-6 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>

            {/* ingrediënten */}
            <Card className="p-6 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />

              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
                <div className="h-3 w-4/6 bg-gray-200 rounded" />
              </div>
            </Card>

            {/* stappen */}
            <Card className="p-6 space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded" />

              <div className="space-y-3">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
                <div className="h-3 w-4/6 bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
            </Card>
          </div>
        </main>
      </>
    );
  }
  if (!preview) {
    return (
      <main
        className="min-h-dvh bg-[var(--color-bg)] pb-24 flex items-center justify-center"
        style={{ paddingTop: "var(--header-height)" }}
      >
        <p className="text-sm text-gray-500">Laden...</p>
      </main>
    );
  }

  // 🔥 Opslaan in database
  const handleSave = async () => {
    if (!preview) return;

    try {
      setSaving(true);
      setSavingOverlay(true); // 👈 overlay aan

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      // 🔹 household ophalen
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .maybeSingle();

      const householdId = membership?.household_id;

      if (!householdId) {
        alert("Geen huishouden gevonden");
        return;
      }

      if (!userId) {
        alert("Geen gebruiker gevonden");
        return;
      }

      // 1️⃣ Recept opslaan
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          title: preview.title,
          ingredients: preview.ingredients,
          steps: preview.steps,
          cooking_time: Number(preview.cooking_time) || 30,
          servings: Number(preview.servings) || 2,
          category: preview.category || "Diner",
          user_id: userId,
          household_id: householdId,
        })
        .select()
        .single();

      if (error || !data) {
        console.error(error);
        alert("Opslaan mislukt");
        return;
      }

      // 2️⃣ Afbeelding genereren
      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: preview.title }),
      });

      const imageData = await imageRes.json();

      if (imageData?.imageBase64) {
        const fileName = `${data.id}.png`;

        const byteCharacters = atob(imageData.imageBase64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });

        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(fileName, blob, {
            contentType: "image/png",
            upsert: true,
          });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("recipe-images").getPublicUrl(fileName);

          await supabase
            .from("recipes")
            .update({ image_url: publicUrl })
            .eq("id", data.id);
        }
      }

      localStorage.removeItem("ai_preview");

      // 👇 kleine visuele delay voor premium gevoel
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push(`/recipe/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setSavingOverlay(false); // 👈 overlay uit
    }
  };

  // 🔥 Regenereren met variatie
  const handleRegenerate = async () => {
    if (!preview || attempt >= maxAttempts) return;

    try {
      setRegenerating(true);

      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: preview.originalIngredients ?? preview.ingredients,
          servings: preview.servings,
          category: preview.category,
          variation: true,
        }),
      });

      const data = await res.json();

      if (!data.error) {
        const updatedPreview = {
          ...data,
          originalIngredients:
            preview.originalIngredients ?? preview.ingredients,
          category: preview.category,
        };

        localStorage.setItem("ai_preview", JSON.stringify(updatedPreview));
        setPreview(updatedPreview);
        setAttempt((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <Header title="Recept preview" onBack={() => router.push("/")} />
      <main className="min-h-dvh bg-[var(--color-bg)] pt-20 pb-24 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-sm text-gray-400 animate-pulse text-center">
            AI genereert een recept...
          </p>
          {/* Hero placeholder */}
          <div className="h-52 bg-gray-200 rounded-2xl" />

          {/* Titel + meta */}
          <div className="space-y-2">
            <h1
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                if (!preview) return;

                setPreview({
                  ...preview,
                  title: e.currentTarget.innerText,
                });
              }}
              className="text-3xl font-bold leading-tight outline-none"
            >
              {preview.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Icon icon={ClockIcon} size={16} />
                <span>{preview.cooking_time} min</span>
              </div>

              <div className="flex items-center gap-1">
                <Icon icon={UserIcon} size={16} />
                <span>
                  {preview.servings}{" "}
                  {preview.servings === 1 ? "persoon" : "personen"}
                </span>
              </div>

              {preview.category && (
                <div className="px-3 py-1 border border-gray-300 rounded-lg capitalize">
                  {preview.category}
                </div>
              )}
            </div>
          </div>

          {/* Ingrediënten */}
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Ingrediënten</h2>
            <ul className="space-y-2 text-sm">
              {preview.ingredients.map((item, i) => (
                <li key={i}>
                  <input
                    value={item}
                    onChange={(e) => {
                      if (!preview) return;

                      const updated = [...preview.ingredients];
                      updated[i] = e.target.value;

                      setPreview({
                        ...preview,
                        ingredients: updated,
                      });
                    }}
                    className="w-full text-sm bg-transparent outline-none focus:bg-gray-50 rounded"
                  />
                </li>
              ))}
            </ul>
          </Card>

          {/* Bereiding */}
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Bereiding</h2>
            <ol className="space-y-3 text-sm">
              {preview.steps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="font-medium">{i + 1}.</span>

                  <textarea
                    value={step}
                    onChange={(e) => {
                      if (!preview) return;

                      const updated = [...preview.steps];
                      updated[i] = e.target.value;

                      setPreview({
                        ...preview,
                        steps: updated,
                      });
                    }}
                    className="w-full text-sm bg-transparent outline-none focus:bg-gray-50 rounded"
                    rows={2}
                  />
                </div>
              ))}
            </ol>
          </Card>

          {/* Acties */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleRegenerate}
              disabled={regenerating || attempt >= maxAttempts}
              className="h-[58px] w-full border border-gray-300 rounded-full py-3 text-md font-semibold flex items-center justify-center"
            >
              {regenerating ? (
                <Icon icon={ArrowPathIcon} size={18} className="animate-spin" />
              ) : attempt >= maxAttempts ? (
                "Geen alternatieven meer"
              ) : (
                `Genereer alternatief (${attempt}/${maxAttempts})`
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`${styles.button.primary} w-full`}
            >
              Opslaan
            </button>
          </div>
        </div>
      </main>
      {savingOverlay && (
        <div
          style={{ top: "-100px", height: "calc(100dvh + 100px)" }}
          className="fixed left-0 w-full z-[9999] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />

          {/* Modal Card */}
          <div className="relative bg-white rounded-xl px-8 py-8 shadow-xl flex flex-col items-center gap-6 animate-fade-in">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-[var(--color-accent)]" />

            <div className="text-center space-y-2">
              <p className="text-base font-semibold text-gray-900">
                Je recept wordt opgeslagen
              </p>
              <p className="text-sm text-gray-500">Een momentje geduld</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
