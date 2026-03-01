"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import { toast } from "sonner";

export default function NewRecipe() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const handleSubmit = async () => {
    if (
      title.trim() === "" ||
      ingredients.trim() === "" ||
      steps.trim() === "" ||
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

    const cleanedIngredients = ingredients
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const cleanedSteps = steps
      .split(/\n\s*\n/)
      .map((step) => step.trim())
      .filter(Boolean);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <Header title="Nieuw recept" onBack={() => router.back()} />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-36">
        <div className="px-4 max-w-4xl mx-auto space-y-4">
          {/* Afbeelding */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-3">
              Afbeelding <span className="text-gray-400">(optioneel)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-56 rounded-xl overflow-hidden cursor-pointer group"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      Wijzig afbeelding
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full bg-gray-100 flex items-center justify-center">
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

          {/* Titel */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input.default}
            />
          </Card>

          {/* Meta + Categorie */}
          <Card className="p-5 space-y-4">
            <div>
              <label className={clsx(styles.label.default, "mb-2")}>
                Kooktijd (minuten) <span className="text-red-500">*</span>
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

            {/* Aantal + Categorie naast elkaar */}
            <div className="flex gap-4 mt-4">
              {/* Aantal */}
              <div className="flex flex-col gap-2 w-16">
                <label className={clsx(styles.label.default)}>Porties</label>

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
                    icon={ChevronDownIcon}
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Categorie */}
              <div className="flex flex-col gap-2 flex-1">
                <label className={clsx(styles.label.default)}>Categorie</label>

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
                    icon={ChevronDownIcon}
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Ingrediënten */}
          <Card className="p-5">
            <label className={clsx(styles.label.default, "mb-2")}>
              Ingrediënten <span className="text-red-500">*</span>
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className={`${styles.input.default} min-h-[280px]`}
            />
          </Card>

          {/* Bereiding */}
          <Card className="p-5">
            <label className={clsx(styles.label.default, "mb-2")}>
              Bereiding <span className="text-red-500">*</span>
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className={`${styles.input.default} min-h-[280px]`}
            />
          </Card>

          {/* Notities */}
          <Card className="p-5">
            <label className={clsx(styles.label.default, "mb-2")}>
              Notities (optioneel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${styles.input.default} min-h-[60px]`}
            />
          </Card>
        </div>
      </main>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <button onClick={handleSubmit} className={styles.button.save}>
          Opslaan
        </button>
      </div>
    </>
  );
}
