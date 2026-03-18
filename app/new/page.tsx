"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Card from "@/components/Card";
import { useRouter } from "next/navigation";
import { ChevronDown, X, Plus, AlignLeft, List, Check } from "lucide-react";
import Icon from "@/components/icons";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type IngredientItem =
  | { type: "title"; value: string }
  | { type: "item"; value: string };

type StepItem =
  | { type: "title"; value: string }
  | { type: "step"; value: string };

// ─── Small reusable components ────────────────────────────────────────────────

function SectionToggle({
  mode,
  onToggle,
}: {
  mode: "list" | "paste";
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors mt-3"
    >
      <Icon icon={mode === "list" ? AlignLeft : List} size={15} />
      {mode === "list" ? "Of plak hele lijst" : "Of voeg één voor één toe"}
    </button>
  );
}

function RemovableItem({
  value,
  placeholder,
  isTitle,
  onChange,
  onRemove,
  onEnter,
  inputRef,
}: {
  value: string;
  placeholder: string;
  isTitle?: boolean;
  onChange: (v: string) => void;
  onRemove: () => void;
  onEnter?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="flex items-center gap-2">
      {isTitle ? (
        <span className="text-gray-300 font-bold text-xs w-4 shrink-0 select-none">
          #
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0 mt-0.5" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className={clsx(
          "flex-1 bg-transparent text-sm outline-none text-[var(--color-text)] placeholder:text-gray-300",
          isTitle && "font-semibold text-[var(--color-text-secondary)]",
        )}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
        tabIndex={-1}
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewRecipe() {
  const router = useRouter();

  // Meta
  const [title, setTitle] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ingredients state
  const [ingredientMode, setIngredientMode] = useState<"list" | "paste">(
    "list",
  );
  const [ingredients, setIngredients] = useState<IngredientItem[]>([
    { type: "item", value: "" },
  ]);
  const [ingredientPaste, setIngredientPaste] = useState("");
  const ingredientInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Steps state
  const [stepMode, setStepMode] = useState<"list" | "paste">("list");
  const [steps, setSteps] = useState<StepItem[]>([{ type: "step", value: "" }]);
  const [stepPaste, setStepPaste] = useState("");
  const stepInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Ingredient helpers ──────────────────────────────────────────────────────

  const addIngredientItem = useCallback(() => {
    setIngredients((prev) => [...prev, { type: "item", value: "" }]);
    setTimeout(() => {
      const refs = ingredientInputRefs.current;
      refs[refs.length - 1]?.focus();
    }, 50);
  }, []);

  const addIngredientTitle = useCallback(() => {
    setIngredients((prev) => [...prev, { type: "title", value: "" }]);
    setTimeout(() => {
      const refs = ingredientInputRefs.current;
      refs[refs.length - 1]?.focus();
    }, 50);
  }, []);

  const updateIngredient = (index: number, value: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const focusNextIngredientOrAdd = (index: number) => {
    const refs = ingredientInputRefs.current;
    if (refs[index + 1]) {
      refs[index + 1]?.focus();
    } else {
      addIngredientItem();
    }
  };

  // Toggle: list → paste: convert existing items to raw text
  const toggleIngredientMode = () => {
    if (ingredientMode === "list") {
      const raw = ingredients
        .map((i) => (i.type === "title" ? `# ${i.value}` : i.value))
        .join("\n");
      setIngredientPaste(raw);
      setIngredientMode("paste");
    } else {
      // paste → list: parse lines
      const items: IngredientItem[] = ingredientPaste
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line.startsWith("#")
            ? { type: "title", value: line.replace(/^#\s*/, "") }
            : { type: "item", value: line.replace(/^[-•]\s*/, "") },
        );
      setIngredients(items);
      setIngredientMode("list");
    }
  };

  // ── Step helpers ────────────────────────────────────────────────────────────

  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, { type: "step", value: "" }]);
    setTimeout(() => {
      const refs = stepInputRefs.current;
      refs[refs.length - 1]?.focus();
    }, 50);
  }, []);

  const addStepTitle = useCallback(() => {
    setSteps((prev) => [...prev, { type: "title", value: "" }]);
    setTimeout(() => {
      const refs = stepInputRefs.current;
      refs[refs.length - 1]?.focus();
    }, 50);
  }, []);

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const focusNextStepOrAdd = (index: number) => {
    const refs = stepInputRefs.current;
    if (refs[index + 1]) {
      refs[index + 1]?.focus();
    } else {
      addStep();
    }
  };

  const toggleStepMode = () => {
    if (stepMode === "list") {
      const raw = steps
        .map((s) => (s.type === "title" ? `# ${s.value}` : s.value))
        .join("\n");
      setStepPaste(raw);
      setStepMode("paste");
    } else {
      const items: StepItem[] = stepPaste
        .split("\n")
        .map((line) => line.trim().replace(/^\d+.\s*/, ""))
        .filter(Boolean)
        .map((line) =>
          line.startsWith("#")
            ? { type: "title", value: line.replace(/^#\s*/, "") }
            : { type: "step", value: line },
        );
      setSteps(items);
      setStepMode("list");
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Resolve final ingredient list
    let finalIngredients: string[] = [];
    if (ingredientMode === "list") {
      finalIngredients = ingredients
        .map((i) => (i.type === "title" ? `# ${i.value}` : i.value))
        .filter((v) => v.trim() !== "" && v.trim() !== "#");
    } else {
      finalIngredients = ingredientPaste
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    }

    // Resolve final steps list
    let finalSteps: string[] = [];
    if (stepMode === "list") {
      finalSteps = steps
        .map((s) => (s.type === "title" ? `# ${s.value}` : s.value).trim())
        .filter((v) => v !== "" && v !== "#");
    } else {
      finalSteps = stepPaste
        .split(/\n(?=\d+\.\s)|\n\s*\n/)
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    }

    if (
      title.trim() === "" ||
      finalIngredients.length === 0 ||
      finalSteps.length === 0 ||
      selectedCategory.trim() === "" ||
      cookingTime === null ||
      selectedServings === null
    ) {
      toast.error("Oeps, het recept is niet compleet");
      return;
    }

    let imageUrl: string | null = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, imageFile);
      if (uploadError) {
        console.error(uploadError);
        return;
      }
      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .single();

    if (!membership) {
      toast.error("Geen household gevonden");
      return;
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          title,
          ingredients: finalIngredients,
          steps: finalSteps,
          category: selectedCategory,
          cooking_time: cookingTime,
          servings: selectedServings,
          notes,
          image_url: imageUrl,
          user_id: userId,
          household_id: membership.household_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Er ging iets mis bij opslaan");
      return;
    }

    toast.success("Recept aangemaakt");
    router.replace(`/recipe/${data.id}`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header — altijd zichtbaar ── */}
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
            Nieuw recept
          </h2>
        </div>
      </div>

      <main
        className="min-h-screen bg-[var(--color-bg)] pb-32"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.5rem)" }}
      >
        <div className="px-4 max-w-4xl mx-auto space-y-4 pt-4">
          {/* ── Afbeelding ── */}
          <Card className="p-5">
            <label className="text-sm text-[var(--color-text-secondary)] block mb-3">
              Afbeelding <span className="text-gray-400">(optioneel)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-52 rounded-xl overflow-hidden cursor-pointer group"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      Wijzig afbeelding
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full bg-gray-100 flex items-center justify-center rounded-xl">
                  <span className="text-gray-400 text-sm">
                    Klik om afbeelding toe te voegen
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
          </Card>

          {/* ── Titel ── */}
          <Card className="p-5">
            <label className="text-sm text-[var(--color-text-secondary)] block mb-2">
              Titel <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Naam van het recept"
              className={styles.input.default}
            />
          </Card>

          {/* ── Meta ── */}
          <Card className="p-5 space-y-4">
            <div>
              <label className={clsx(styles.label.default, "mb-2")}>
                Kooktijd (minuten) <span className="text-red-400">*</span>
              </label>
              <input
                inputMode="numeric"
                value={cookingTime ?? ""}
                placeholder="30"
                onChange={(e) =>
                  setCookingTime(e.target.value ? Number(e.target.value) : null)
                }
                className={styles.input.default}
              />
            </div>

            <div className="flex gap-4">
              {/* Porties */}
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

              {/* Categorie */}
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
          </Card>

          {/* ── Ingrediënten ── */}
          <Card className="p-5">
            <label className={clsx(styles.label.default, "mb-4")}>
              Ingrediënten <span className="text-red-400">*</span>
            </label>

            {ingredientMode === "list" ? (
              <>
                {/* Item list */}
                <div className="space-y-2.5">
                  {ingredients.map((item, index) => (
                    <RemovableItem
                      key={index}
                      value={item.value}
                      placeholder={
                        item.type === "title"
                          ? "Sectienaam..."
                          : "Ingrediënt..."
                      }
                      isTitle={item.type === "title"}
                      onChange={(v) => updateIngredient(index, v)}
                      onRemove={() => removeIngredient(index)}
                      onEnter={() => focusNextIngredientOrAdd(index)}
                      inputRef={
                        {
                          current: ingredientInputRefs.current[index],
                        } as React.RefObject<HTMLInputElement>
                      }
                    />
                  ))}
                </div>

                {/* Divider */}
                {ingredients.length > 0 && (
                  <div className="border-t border-gray-100 my-3" />
                )}

                {/* Add buttons */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={addIngredientItem}
                    className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <Plus size={14} />
                    Ingrediënt
                  </button>
                  <button
                    type="button"
                    onClick={addIngredientTitle}
                    className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <Plus size={14} />
                    Sectietitel
                  </button>
                </div>

                <SectionToggle mode="list" onToggle={toggleIngredientMode} />
              </>
            ) : (
              <>
                <textarea
                  value={ingredientPaste}
                  onChange={(e) => setIngredientPaste(e.target.value)}
                  placeholder={"500g bloem\n2 eieren\n1 tl zout\n..."}
                  className={clsx(styles.input.default, "min-h-[200px]")}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  Elke regel wordt een apart ingrediënt. Begin een regel met{" "}
                  <code className="bg-gray-100 px-1 rounded">#</code> voor een
                  sectietitel.
                </p>
                <SectionToggle mode="paste" onToggle={toggleIngredientMode} />
              </>
            )}
          </Card>

          {/* ── Bereiding ── */}
          <Card className="p-5">
            <label className={clsx(styles.label.default, "mb-4")}>
              Bereiding <span className="text-red-400">*</span>
            </label>

            {stepMode === "list" ? (
              <>
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const isTitle = step.type === "title";
                    // Count only non-title steps before this index for numbering
                    const stepNumber =
                      steps.slice(0, index).filter((s) => s.type === "step")
                        .length + 1;
                    return (
                      <div key={index} className="flex items-start gap-2 group">
                        {isTitle ? (
                          <span className="text-gray-300 font-bold text-xs w-5 shrink-0 select-none pt-0.5">
                            #
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm min-w-[20px] pt-0.5 select-none shrink-0">
                            {stepNumber}.
                          </span>
                        )}
                        <input
                          ref={(el) => {
                            stepInputRefs.current[index] = el;
                          }}
                          type="text"
                          value={step.value}
                          placeholder={
                            isTitle ? "Sectienaam..." : `Stap ${stepNumber}...`
                          }
                          onChange={(e) => updateStep(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              focusNextStepOrAdd(index);
                            }
                          }}
                          className={clsx(
                            "flex-1 bg-transparent text-sm outline-none text-[var(--color-text)] placeholder:text-gray-300",
                            isTitle &&
                              "font-semibold text-[var(--color-text-secondary)]",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
                          tabIndex={-1}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {steps.length > 0 && (
                  <div className="border-t border-gray-100 my-3" />
                )}

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <Plus size={14} />
                    Stap
                  </button>
                  <button
                    type="button"
                    onClick={addStepTitle}
                    className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <Plus size={14} />
                    Sectietitel
                  </button>
                </div>

                <SectionToggle mode="list" onToggle={toggleStepMode} />
              </>
            ) : (
              <>
                <textarea
                  value={stepPaste}
                  onChange={(e) => setStepPaste(e.target.value)}
                  placeholder={
                    "Verwarm de oven op 180°C.\nMeng de bloem met de eieren.\nBak 25 minuten.\n..."
                  }
                  className={clsx(styles.input.default, "min-h-[200px]")}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  Elke regel (of genummerde stap) wordt een apart
                  bereidingsstap.
                </p>
                <SectionToggle mode="paste" onToggle={toggleStepMode} />
              </>
            )}
          </Card>

          {/* ── Notities ── */}
          <Card className="p-5">
            <label className={clsx(styles.label.default, "mb-2")}>
              Notities <span className="text-gray-400">(optioneel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tips, variaties, bewaaradvies..."
              className={clsx(styles.input.default, "min-h-[100px]")}
            />
          </Card>
        </div>
      </main>

      {/* ── Floating save button ── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-50"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium shadow-lg pointer-events-auto active:scale-95 transition-transform"
        >
          <Check size={18} strokeWidth={2} />
          Opslaan
        </button>
      </div>
    </>
  );
}
