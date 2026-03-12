"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Header from "@/components/Header";
import Icon from "@/components/icons";
import { styles } from "@/lib/styles";
import { toast } from "sonner";
import { Plus, X, ChevronDown } from "lucide-react";
import clsx from "clsx";

export default function NewRecipe() {
  const router = useRouter();

  const [title, setTitle] = useState("");

  const [ingredients, setIngredients] = useState<string[]>([""]);
  const ingredientRefs = useRef<HTMLInputElement[]>([]);

  const [steps, setSteps] = useState<string[]>([""]);
  const stepRefs = useRef<HTMLInputElement[]>([]);

  const [notes, setNotes] = useState("");

  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  /* INGREDIENT FUNCTIONS */

  const addIngredient = () => {
    setIngredients((prev) => [...prev, ""]);

    setTimeout(() => {
      ingredientRefs.current[ingredients.length]?.focus();
    }, 0);
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length === 1) return;

    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);

    setTimeout(() => {
      ingredientRefs.current[index - 1]?.focus();
    }, 0);
  };

  /* STEP FUNCTIONS */

  const addStep = () => {
    setSteps((prev) => [...prev, ""]);

    setTimeout(() => {
      stepRefs.current[steps.length]?.focus();
    }, 0);
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) return;

    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);

    setTimeout(() => {
      stepRefs.current[index - 1]?.focus();
    }, 0);
  };

  /* SUBMIT */

  const handleSubmit = async () => {
    if (
      !title.trim() ||
      ingredients.filter((i) => i.trim()).length === 0 ||
      steps.filter((s) => s.trim()).length === 0 ||
      !cookingTime
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
        toast.error("Upload mislukt");
        return;
      }

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const cleanedIngredients = ingredients.map((i) => i.trim()).filter(Boolean);

    const cleanedSteps = steps.map((s) => s.trim()).filter(Boolean);

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
          ingredients: cleanedIngredients,
          steps: cleanedSteps,
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
      toast.error("Opslaan mislukt");
      return;
    }

    toast.success("Recept aangemaakt");

    router.replace(`/recipe/${data.id}`);
  };

  return (
    <>
      <Header title="Nieuw recept" showClose onBack={() => router.push("/")} />

      <main
        style={{ paddingTop: "var(--header-height)" }}
        className="min-h-screen bg-[var(--color-bg)] pb-32"
      >
        {/* HERO IMAGE */}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-[40vh] bg-gray-100 flex items-center justify-center cursor-pointer"
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-sm">
              Klik om foto toe te voegen
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
        />

        <div className="px-4 max-w-3xl mx-auto space-y-6 mt-6">
          {/* TITLE */}

          <input
            placeholder="Wat staat er op het menu?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold text-center outline-none bg-transparent"
          />

          {/* META */}

          <div className="flex justify-center gap-4">
            {/* Cooking time */}

            <input
              inputMode="numeric"
              placeholder="30 min"
              value={cookingTime ?? ""}
              onChange={(e) =>
                setCookingTime(e.target.value ? Number(e.target.value) : null)
              }
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 text-center outline-none"
            />

            {/* Servings */}

            <div className="relative">
              <select
                value={selectedServings}
                onChange={(e) => setSelectedServings(Number(e.target.value))}
                className={clsx(
                  styles.dropdown.trigger,
                  "appearance-none pr-8",
                )}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <Icon
                icon={ChevronDown}
                size={18}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Category */}

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={clsx(
                  styles.dropdown.trigger,
                  "appearance-none pr-8",
                )}
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <Icon
                icon={ChevronDown}
                size={18}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* INGREDIENTS */}

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Ingrediënten</h2>

            <div className="space-y-2">
              {ingredients.map((ingredient, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />

                  <input
                    ref={(el) => {
                      if (el) ingredientRefs.current[i] = el;
                    }}
                    value={ingredient}
                    enterKeyHint="next"
                    onChange={(e) => updateIngredient(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredient();
                      }

                      if (e.key === "Backspace" && ingredient === "") {
                        e.preventDefault();
                        removeIngredient(i);
                      }
                    }}
                    className="
                      flex-1
                      bg-gray-50
                      border
                      border-gray-200
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      outline-none
                    "
                    placeholder={i === 0 ? "bijv. 200g pasta" : ""}
                  />

                  {ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(i)}
                      className="text-gray-400"
                    >
                      <Icon icon={X} size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addIngredient}
              className="flex items-center gap-1 text-sm text-gray-500"
            >
              <Icon icon={Plus} size={16} />
              Ingrediënt toevoegen
            </button>
          </Card>

          {/* STEPS */}

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-lg">Bereiding</h2>

            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-gray-400">{i + 1}.</span>

                <input
                  ref={(el) => {
                    if (el) ingredientRefs.current[i] = el;
                  }}
                  value={step}
                  enterKeyHint="next"
                  onChange={(e) => updateStep(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addStep();
                    }

                    if (e.key === "Backspace" && step === "") {
                      e.preventDefault();
                      removeStep(i);
                    }
                  }}
                  className="
                    flex-1
                    bg-gray-50
                    border
                    border-gray-200
                    rounded-lg
                    px-3
                    py-2
                    text-sm
                    outline-none
                  "
                  placeholder={i === 0 ? "bijv. Snijd de ui fijn" : ""}
                />

                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(i)}
                    className="text-gray-400"
                  >
                    <Icon icon={X} size={16} />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addStep}
              className="flex items-center gap-1 text-sm text-gray-500"
            >
              <Icon icon={Plus} size={16} />
              Stap toevoegen
            </button>
          </Card>

          {/* NOTES */}

          <Card className="p-5">
            <h2 className="font-semibold mb-3">Notities</h2>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="
                w-full
                min-h-[100px]
                bg-gray-50
                border
                border-gray-200
                rounded-lg
                px-3
                py-2
                text-sm
                outline-none
              "
            />
          </Card>
        </div>
      </main>

      {/* SAVE BUTTON */}

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <button onClick={handleSubmit} className={styles.button.save}>
          Opslaan
        </button>
      </div>
    </>
  );
}
