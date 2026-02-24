"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
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

export default function PreviewPage() {
  const router = useRouter();

  const [preview, setPreview] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [attempt, setAttempt] = useState(1);
  const maxAttempts = 3;

  // 🔥 Load preview uit localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ai_preview");
    if (!stored) {
      router.push("/");
      return;
    }

    setPreview(JSON.parse(stored));
  }, [router]);

  if (!preview) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Laden...</p>
      </main>
    );
  }

  // 🔥 Opslaan in database
  const handleSave = async () => {
    if (!preview) return;

    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

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
      console.log("IMAGE RESPONSE:", imageData);

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

      router.push(`/recipe/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
          {/* Hero placeholder */}
          <div className="h-52 bg-gray-200 rounded-2xl" />

          {/* Titel + meta */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{preview.title}</h1>

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
              {preview.ingredients.map((item: string, i: number) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </Card>

          {/* Bereiding */}
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Bereiding</h2>
            <ol className="space-y-3 text-sm">
              {preview.steps.map((step: string, i: number) => (
                <li key={i}>
                  <span className="font-medium mr-2">{i + 1}.</span>
                  {step}
                </li>
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
    </>
  );
}
