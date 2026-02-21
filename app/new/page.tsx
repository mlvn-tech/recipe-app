"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

export default function NewRecipe() {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [servings, setServings] = useState<number | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    const { error } = await supabase.from("recipes").insert([
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
    ]);

    if (!error) {
      alert("Recept opgeslagen!");
    }
  };

  return (
    <>
      <Header title="Nieuw recept" />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-32">
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

            <div>
              <label className="text-sm text-gray-500 block mb-2">
                Categorie <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-3 bg-gray-50 focus:outline-none focus:border-gray-300"
              >
                <option value="">Selecteer categorie</option>
                <option value="Ontbijt">Ontbijt</option>
                <option value="Lunch">Lunch</option>
                <option value="Diner">Diner</option>
                <option value="Dessert">Dessert</option>
                <option value="Snack">Snack</option>
              </select>
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
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
