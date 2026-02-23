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
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [servings, setServings] = useState<number | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const handleSubmit = async () => {
    if (
      title.trim() === "" ||
      ingredients.trim() === "" ||
      steps.trim() === "" ||
      category.trim() === "" ||
      cookingTime === null ||
      servings === null
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

    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          title,
          ingredients: cleanedIngredients,
          steps: cleanedSteps,
          category,
          cooking_time: cookingTime,
          servings,
          notes,
          image_url: imageUrl,
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

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-24">
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
              <label className="text-sm text-gray-500 block mb-2">
                Aantal personen <span className="text-red-500">*</span>
              </label>
              <input
                inputMode="numeric"
                value={servings ?? ""}
                onChange={(e) =>
                  setServings(e.target.value ? Number(e.target.value) : null)
                }
                className={styles.input.default}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">
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

            <div ref={categoryRef} className="relative">
              <label className="text-sm text-gray-500 block mb-2">
                Categorie <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 flex justify-between items-center"
              >
                <span className={category ? "" : "text-gray-400"}>
                  {category || "Selecteer categorie"}
                </span>
                <Icon
                  icon={ChevronDownIcon}
                  size={20}
                  className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`}
                />
              </button>

              {categoryOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setCategoryOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Ingrediënten */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">
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
            <label className="text-sm text-gray-500 block mb-2">
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
            <label className="text-sm text-gray-500 block mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${styles.input.default} min-h-[30px]`}
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
