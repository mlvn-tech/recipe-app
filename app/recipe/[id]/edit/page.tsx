"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  X,
  Plus,
  AlignLeft,
  List,
  Check,
  ImageIcon,
  Trash2,
} from "lucide-react";
import Icon from "@/components/icons";
import { toast } from "sonner";
import Card from "@/components/Card";

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
}: {
  value: string;
  placeholder: string;
  isTitle?: boolean;
  onChange: (v: string) => void;
  onRemove: () => void;
  onEnter?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="flex items-start gap-2">
      {isTitle ? (
        <span className="text-gray-300 font-bold text-xs w-4 shrink-0 select-none mt-2">
          #
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0 mt-2" />
      )}
      <textarea
        ref={textareaRef}
        value={value}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className={clsx(
          "flex-1 bg-transparent text-sm outline-none text-[var(--color-text)] placeholder:text-gray-300 resize-none overflow-hidden leading-relaxed",
          isTitle && "font-semibold text-[var(--color-text-secondary)]",
        )}
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-1.5"
        tabIndex={-1}
      >
        <X size={15} />
      </button>
    </div>
  );
}

function AutoTextarea({
  value,
  placeholder,
  isTitle,
  onChange,
  onEnter,
}: {
  value: string;
  placeholder: string;
  isTitle?: boolean;
  onChange: (v: string) => void;
  onEnter?: () => void;
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
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter?.();
        }
      }}
      className={clsx(
        "flex-1 bg-transparent text-sm outline-none text-[var(--color-text)] placeholder:text-gray-300 resize-none overflow-hidden leading-relaxed",
        isTitle && "font-semibold text-[var(--color-text-secondary)]",
      )}
    />
  );
}

export default function EditRecipe() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Meta
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [servings, setServings] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFloatingSave, setShowFloatingSave] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  // Ingredients state
  const [ingredientMode, setIngredientMode] = useState<"list" | "paste">(
    "list",
  );
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [ingredientPaste, setIngredientPaste] = useState("");
  const ingredientInputRefs = useRef<(HTMLElement | null)[]>([]);
  // Steps state
  const [stepMode, setStepMode] = useState<"list" | "paste">("list");
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [stepPaste, setStepPaste] = useState("");
  const stepInputRefs = useRef<(HTMLElement | null)[]>([]);

  // ── Scroll detection for floating save ─────────────────────────────────────

  useEffect(() => {
    const handleScroll = () => {
      if (!deleteRef.current) return;
      const rect = deleteRef.current.getBoundingClientRect();
      setShowFloatingSave(rect.top > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Fetch existing recipe ───────────────────────────────────────────────────

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setTitle(data.title || "");
        setCategory(data.category || "");
        setCookingTime(data.cooking_time);
        setNotes(data.notes || "");
        setServings(data.servings);
        if (data.image_url) setImagePreview(data.image_url);

        // Parse ingredients: lines starting with # become titles
        const parsedIngredients: IngredientItem[] = (
          data.ingredients || []
        ).map((line: string) =>
          line.startsWith("#")
            ? { type: "title", value: line.replace(/^#\s*/, "") }
            : { type: "item", value: line },
        );
        setIngredients(
          parsedIngredients.length > 0
            ? parsedIngredients
            : [{ type: "item", value: "" }],
        );

        // Parse steps: lines starting with # become titles
        const parsedSteps: StepItem[] = (data.steps || []).map(
          (line: string) =>
            line.startsWith("#")
              ? { type: "title", value: line.replace(/^#\s*/, "") }
              : { type: "step", value: line },
        );
        setSteps(
          parsedSteps.length > 0 ? parsedSteps : [{ type: "step", value: "" }],
        );
      }

      setLoading(false);
    };

    if (id) fetchRecipe();
  }, [id]);

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

  const toggleIngredientMode = () => {
    if (ingredientMode === "list") {
      const raw = ingredients
        .map((i) => (i.type === "title" ? `# ${i.value}` : i.value))
        .join("\n");
      setIngredientPaste(raw);
      setIngredientMode("paste");
    } else {
      const items: IngredientItem[] = ingredientPaste
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line.startsWith("#")
            ? { type: "title", value: line.replace(/^#\s*/, "") }
            : { type: "item", value: line.replace(/^[-•]\s*/, "") },
        );
      setIngredients(items.length > 0 ? items : [{ type: "item", value: "" }]);
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
      setSteps(items.length > 0 ? items : [{ type: "step", value: "" }]);
      setStepMode("list");
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleUpdate = async () => {
    // Resolve final ingredients
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

    // Resolve final steps
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
      cookingTime === null
    ) {
      toast.error("Oeps, het recept is niet compleet");
      return;
    }

    let imageUrl = imagePreview;

    if (imageFile) {
      if (imagePreview && !imagePreview.startsWith("blob:")) {
        const oldPath = imagePreview.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("recipe-images").remove([oldPath]);
        }
      }
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, imageFile);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }
      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("recipes")
      .update({
        title,
        ingredients: finalIngredients,
        steps: finalSteps,
        category,
        cooking_time: cookingTime,
        servings,
        notes,
        image_url: imageUrl,
      })
      .eq("id", id);

    if (!error) {
      toast.success("Recept aangepast");
      router.replace(`/recipe/${id}`);
    } else {
      toast.error("Er ging iets mis bij opslaan");
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      "Weet je zeker dat je dit recept wilt verwijderen?",
    );
    if (!confirmed) return;
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (!error) router.replace("/");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <p className="p-8">Laden...</p>;

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
            onClick={() => router.push(`/recipe/${id}`)}
            className="absolute left-4 text-[var(--color-text-secondary)] active:opacity-70 transition-opacity p-1 -ml-1"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-[var(--color-text)] leading-tight tracking-tight text-base">
            Bewerken
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
              className="relative h-52 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-end justify-between p-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full"
                    >
                      <ImageIcon size={13} />
                      Wijzigen
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full"
                    >
                      <Trash2 size={13} />
                      Verwijderen
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full bg-gray-100 flex flex-col items-center justify-center gap-2 rounded-xl">
                  <ImageIcon size={24} className="text-gray-300" />
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
                onChange={(e) =>
                  setCookingTime(e.target.value ? Number(e.target.value) : null)
                }
                className={styles.input.default}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-16">
                <label className={styles.label.default}>Porties</label>
                <div className="relative">
                  <select
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={clsx(
                      styles.dropdown.trigger,
                      "appearance-none cursor-pointer",
                    )}
                  >
                    <option value="">Kies categorie</option>
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
                    />
                  ))}
                </div>

                {ingredients.length > 0 && (
                  <div className="border-t border-gray-100 my-3" />
                )}

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
                    const stepNumber =
                      steps.slice(0, index).filter((s) => s.type === "step")
                        .length + 1;
                    return (
                      <div key={index} className="flex items-start gap-2">
                        {isTitle ? (
                          <span className="text-gray-300 font-bold text-xs w-5 shrink-0 select-none mt-2">
                            #
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm min-w-[20px] select-none shrink-0 mt-1.5">
                            {stepNumber}.
                          </span>
                        )}
                        <AutoTextarea
                          value={step.value}
                          placeholder={
                            isTitle ? "Sectienaam..." : `Stap ${stepNumber}...`
                          }
                          isTitle={isTitle}
                          onChange={(v) => updateStep(index, v)}
                          onEnter={() => focusNextStepOrAdd(index)}
                        />
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-1.5"
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

          {/* ── Opslaan / Verwijderen ── */}
          <div ref={deleteRef} className="pt-2 pb-4 space-y-3">
            <button onClick={handleUpdate} className={styles.button.save}>
              Opslaan
            </button>
            <button onClick={handleDelete} className={styles.button.delete}>
              Verwijderen
            </button>
          </div>
        </div>
      </main>

      {/* ── Floating save button ── */}
      <div
        className={clsx(
          "fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-50 transition-all duration-300",
          showFloatingSave ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <button
          onClick={handleUpdate}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-medium shadow-lg pointer-events-auto active:scale-95 transition-transform"
        >
          <Check size={18} strokeWidth={2} />
          Opslaan
        </button>
      </div>
    </>
  );
}
