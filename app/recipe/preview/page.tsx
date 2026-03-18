"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Clock, User, X, WandSparkles, Check } from "lucide-react";
import Icon from "@/components/icons";
import Card from "@/components/Card";
import { styles } from "@/lib/styles";
import clsx from "clsx";
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

// ── Saving overlay ────────────────────────────────────────────────────────────

const SAVE_STAGES = [
  { label: "Recept opslaan", max: 18 },
  { label: "Afbeelding genereren", max: 72 },
  { label: "Afbeelding opslaan", max: 92 },
  { label: "Klaar!", max: 100 },
];

function SavingOverlay({ stage }: { stage: number }) {
  const [displayPct, setDisplayPct] = useState(0);
  const rafRef = useRef<number>(0);

  const done = stage >= SAVE_STAGES.length;
  const currentStage = SAVE_STAGES[Math.min(stage, SAVE_STAGES.length - 1)];
  const targetMax = done ? 100 : currentStage.max;

  // Crawl slowly toward targetMax, never overshoot it
  useEffect(() => {
    const tick = () => {
      setDisplayPct((prev) => {
        if (prev >= targetMax) return prev;
        // Slow down as we get closer to the ceiling
        const gap = targetMax - prev;
        const step = Math.max(0.08, gap * 0.012);
        return Math.min(prev + step, targetMax);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetMax]);

  const roundedPct = Math.floor(displayPct);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-3xl px-6 py-8 shadow-2xl space-y-5">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className={clsx(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500",
              done ? "bg-green-100" : "bg-[rgb(var(--color-secondaccent)/0.1)]",
            )}
          >
            {done ? (
              <Check size={22} className="text-green-500" />
            ) : (
              <WandSparkles
                size={22}
                className="text-[rgb(var(--color-secondaccent))] animate-pulse"
              />
            )}
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="font-semibold text-gray-900 text-base">
            {done ? "Recept opgeslagen!" : "Recept wordt opgeslagen"}
          </p>
          <p className="text-sm text-gray-400 transition-all duration-300">
            {currentStage.label}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${displayPct}%`,
                background: "rgb(var(--color-secondaccent))",
              }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-gray-400 font-medium tabular-nums">
              {roundedPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const router = useRouter();

  const [preview, setPreview] = useState<AIRecipe | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const maxAttempts = 3;

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ai_preview");
    if (!stored) {
      router.push("/");
      return;
    }
    setPreview(JSON.parse(stored));
    const t = setTimeout(() => setAiLoading(false), 600);
    return () => clearTimeout(t);
  }, [router]);

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!preview) return;

    try {
      setSaving(true);
      setSaveStage(0);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .maybeSingle();

      const householdId = membership?.household_id;
      if (!householdId || !userId) return;

      // Stage 0 → save recipe
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
          is_ai: true,
        })
        .select()
        .single();

      if (error || !data) {
        console.error(error);
        return;
      }

      // Stage 1 → generate image
      setSaveStage(1);
      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: preview.title }),
      });
      const imageData = await imageRes.json();

      // Stage 2 → upload image
      setSaveStage(2);
      if (imageData?.imageBase64) {
        const fileName = `${data.id}.png`;
        const byteCharacters = atob(imageData.imageBase64);
        const byteArray = new Uint8Array(
          Array.from(byteCharacters).map((c) => c.charCodeAt(0)),
        );
        const blob = new Blob([byteArray], { type: "image/png" });

        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(fileName, blob, { contentType: "image/png", upsert: true });

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

      // Stage 3 → done
      setSaveStage(3);
      localStorage.removeItem("ai_preview");
      await new Promise((r) => setTimeout(r, 800));
      router.push(`/recipe/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Regenerate ──────────────────────────────────────────────────────────────

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
        const updated = {
          ...data,
          originalIngredients:
            preview.originalIngredients ?? preview.ingredients,
          category: preview.category,
        };
        localStorage.setItem("ai_preview", JSON.stringify(updated));
        setPreview(updated);
        setAttempt((p) => p + 1);
      }
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setRegenerating(false);
    }
  };

  // ── Skeleton ────────────────────────────────────────────────────────────────

  if (aiLoading) {
    return (
      <>
        {/* Header skeleton */}
        <div
          className="fixed top-0 left-0 right-0 z-20 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-gray-100"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
            paddingBottom: "0.75rem",
          }}
        >
          <div className="relative flex items-center justify-center px-4 max-w-4xl mx-auto">
            <div className="absolute left-4 w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <main
          className="min-h-dvh bg-[var(--color-bg)] pb-32"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.5rem)" }}
        >
          <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4 animate-pulse">
            <div className="h-52 bg-gray-200 rounded-2xl" />
            <div className="space-y-2 px-1">
              <div className="h-8 w-2/3 bg-gray-200 rounded" />
              <div className="flex gap-3">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            <Card className="p-5 space-y-3">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 bg-gray-200 rounded"
                  style={{ width: `${85 - i * 8}%` }}
                />
              ))}
            </Card>
            <Card className="p-5 space-y-3">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 bg-gray-200 rounded"
                  style={{ width: `${90 - i * 5}%` }}
                />
              ))}
            </Card>
          </div>
        </main>
      </>
    );
  }

  if (!preview) return null;

  // ── Render ──────────────────────────────────────────────────────────────────

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
            Recept preview
          </h2>
        </div>
      </div>

      <main
        className="min-h-dvh bg-[var(--color-bg)] pb-32"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.5rem)" }}
      >
        <div className="max-w-3xl mx-auto pb-16">
          {/* Hero placeholder */}
          <div className="h-52 bg-gray-200 flex items-center justify-center">
            <WandSparkles size={28} className="text-gray-300" />
          </div>

          {/* Titel + meta — zelfde opbouw als recipe page */}
          <div className="px-4 flex flex-col items-center space-y-7 pt-8">
            <h1
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const formatted = formatTitle(e.currentTarget.innerText.trim());
                setPreview((p) => (p ? { ...p, title: formatted } : p));
                e.currentTarget.innerText = formatted;
              }}
              className="text-3xl text-center font-bold leading-tight outline-none text-[var(--color-text)] border-b border-transparent focus:border-gray-200 transition-colors pb-0.5 w-full"
            >
              {formatTitle(preview.title)}
            </h1>

            <div className="flex items-center gap-6 text-md text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-1">
                <Icon icon={Clock} size={20} />
                <span>{preview.cooking_time} minuten</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon={User} size={20} />
                <span>{preview.servings} personen</span>
              </div>
            </div>

            <div className="flex gap-2">
              {preview.category && (
                <div className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 text-sm capitalize">
                  {preview.category}
                </div>
              )}
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg border border-[rgb(var(--color-secondaccent)/0.40)] text-[rgb(var(--color-secondaccent))] text-xs">
                <Icon icon={WandSparkles} size={14} />
                AI gegenereerd
              </div>
            </div>
          </div>

          {/* Ingrediënten + bereiding + acties */}
          <div className="px-4 space-y-4 mt-8">
            {/* Ingrediënten */}
            <Card>
              <h2 className="font-semibold mb-4 text-lg">Ingrediënten</h2>
              <ul className="space-y-3">
                {preview.ingredients.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2.5 h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                    <input
                      value={item}
                      onChange={(e) => {
                        const updated = [...preview.ingredients];
                        updated[i] = e.target.value;
                        setPreview((p) =>
                          p ? { ...p, ingredients: updated } : p,
                        );
                      }}
                      className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)] border-b border-transparent focus:border-gray-200 transition-colors pb-0.5"
                    />
                  </li>
                ))}
              </ul>
            </Card>

            {/* Bereiding */}
            <Card>
              <h2 className="font-semibold text-lg leading-none mb-4">
                Bereiding
              </h2>
              <ol className="space-y-0">
                {preview.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-1 py-4 border-b border-gray-100 last:border-none"
                  >
                    <span className="text-gray-400 font-semibold min-w-[24px]">
                      {i + 1}.
                    </span>
                    <AutoTextarea
                      value={step}
                      onChange={(v) => {
                        const updated = [...preview.steps];
                        updated[i] = v;
                        setPreview((p) => (p ? { ...p, steps: updated } : p));
                      }}
                    />
                  </li>
                ))}
              </ol>
            </Card>

            {/* Acties */}
            <div className="pt-2 pb-6 space-y-3">
              <button
                onClick={handleRegenerate}
                disabled={regenerating || attempt >= maxAttempts}
                className={clsx(
                  "h-[58px] w-full border-2 border-[rgb(var(--color-secondaccent)/0.50)] text-[rgb(var(--color-secondaccent))] rounded-full py-3 text-md font-semibold flex items-center justify-center gap-2",
                  attempt >= maxAttempts && "opacity-40 cursor-not-allowed",
                )}
              >
                {attempt >= maxAttempts ? (
                  "Geen alternatieven meer"
                ) : (
                  <>
                    <WandSparkles
                      size={20}
                      className={regenerating ? "animate-pulse" : ""}
                    />
                    {regenerating
                      ? "Alternatief genereren…"
                      : `Genereer alternatief (${attempt}/${maxAttempts})`}
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`${styles.button.aigenerate} w-full`}
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Saving overlay ── */}
      {saving && <SavingOverlay stage={saveStage} />}
    </>
  );
}

// ── AutoTextarea ──────────────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)] resize-none overflow-hidden leading-relaxed border-b border-transparent focus:border-gray-200 transition-colors pb-0.5"
    />
  );
}
