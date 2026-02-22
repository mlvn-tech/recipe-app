"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
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
  const [isDirty, setIsDirty] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const categories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (
      !title ||
      !ingredients ||
      !steps ||
      !category ||
      !cookingTime ||
      !servings
    ) {
      alert("Oeps, het recept is niet compleet");
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
      .map((item) => item.trim())
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

    if (!error && data) {
      toast.success("Recept aangemaakt");
      router.replace(`/recipe/${data.id}`);
    }
  };

  // 🔹 Sluit dropdown bij klik buiten
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
  // 🔥 Dirty state detectie
  useEffect(() => {
    if (
      title ||
      ingredients ||
      steps ||
      category ||
      cookingTime ||
      servings ||
      notes ||
      imageFile
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [
    title,
    ingredients,
    steps,
    category,
    cookingTime,
    servings,
    notes,
    imageFile,
  ]);

  // 🔥 Waarschuwing bij refresh / sluiten
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  return (
    <>
      <Header title="Nieuw recept" />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20">
        <div className="px-4 max-w-4xl mx-auto space-y-4">
          {/* 🖼 Afbeelding */}
          <div className="bg-white rounded-md p-5 shadow-sm">
            <label className="text-sm text-gray-500 block mb-3">
              Afbeelding <span className="text-gray-400">(optioneel)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-56 rounded-md overflow-hidden cursor-pointer group"
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
          </div>

          {/* Titel */}
          <div className="bg-white rounded-md p-5 shadow-sm">
            <label className="text-sm text-gray-500 block mb-2">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 focus:outline-none focus:border-gray-300"
            />
          </div>

          {/* Meta */}
          <div className="bg-white rounded-md p-5 shadow-sm space-y-4">
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
                className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 focus:outline-none focus:border-gray-300"
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
                className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* Custom Dropdown */}
            <div ref={categoryRef} className="relative">
              <label className="text-sm text-gray-500 block mb-2">
                Categorie
              </label>

              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="
                  w-full border border-gray-200 rounded-md p-3
                  bg-gray-50 flex justify-between items-center
                  focus:outline-none
                "
              >
                <span className={category ? "" : "text-gray-400"}>
                  {category
                    ? category.charAt(0).toUpperCase() +
                      category.slice(1).toLowerCase()
                    : "Selecteer categorie"}
                </span>

                <Icon
                  icon={ChevronDownIcon}
                  size={20}
                  className={`
                    text-gray-500
                    transition-transform duration-200
                    ${categoryOpen ? "rotate-180" : ""}
                  `}
                />
              </button>

              {/* Zwevende dropdown */}
              <div
                className={`
                  absolute left-0 right-0 top-full
                  mt-2
                  bg-white rounded-md shadow-lg
                  overflow-hidden z-50
                  transition-all duration-200 ease-out origin-top
                  ${
                    categoryOpen
                      ? "opacity-100 translate-y-0 scale-y-100"
                      : "opacity-0 -translate-y-2 scale-y-95 pointer-events-none"
                  }
                `}
              >
                <div className="py-2">
                  {categories.map((cat, index) => (
                    <div key={cat}>
                      <button
                        onClick={() => {
                          setCategory(cat);
                          setCategoryOpen(false);
                        }}
                        className="
                          w-full text-left px-4 py-3
                          hover:bg-gray-50
                          transition-colors
                        "
                      >
                        {cat}
                      </button>

                      {index !== categories.length - 1 && (
                        <div className="mx-4 border-b border-gray-100" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ingrediënten */}
          <div className="bg-white rounded-md p-5 shadow-sm">
            <label className="text-sm text-gray-500 block mb-2">
              Ingrediënten <span className="text-red-500">*</span>
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 min-h-[280px] focus:outline-none focus:border-gray-300"
            />
          </div>

          {/* Bereiding */}
          <div className="bg-white rounded-md p-5 shadow-sm">
            <label className="text-sm text-gray-500 block mb-2">
              Bereiding <span className="text-red-500">*</span>
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 min-h-[280px] focus:outline-none focus:border-gray-300"
            />
          </div>

          {/* Notities */}
          <div className="bg-white rounded-md p-5 shadow-sm">
            <label className="text-sm text-gray-500 block mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 focus:outline-none focus:border-gray-300"
            />
          </div>
        </div>
      </main>

      {/* Floating Save */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={handleSubmit}
          className="bg-[var(--color-accent)] text-white px-8 py-3 rounded-md shadow-lg text-sm font-semibold active:scale-95 transition"
        >
          Opslaan
        </button>
      </div>
    </>
  );
}
