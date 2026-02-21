"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewRecipe() {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [servings, setServings] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!title) return;

    let imageUrl: string | null = null;

    // 🔹 1. Upload afbeelding
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        return;
      }

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    // 🥬 Ingrediënten opschonen
    const cleanedIngredients = ingredients
      .split("\n")
      .map(
        (item) => item.trim().replace(/^[-•\s]+/, ""), // verwijdert - of • aan begin
      )
      .filter(Boolean);

    // 🧑‍🍳 Stappen slim opsplitsen
    let cleanedSteps: string[] = [];

    // Als er nummering aanwezig is (1. 2. 3.)
    if (/\d+\.\s/.test(steps)) {
      cleanedSteps = steps
        .trim()
        .split(/\n?\d+\.\s+/)
        .filter(Boolean);
    } else {
      // fallback: split op lege regels
      cleanedSteps = steps
        .split(/\n\s*\n/)
        .map((step) => step.trim())
        .filter(Boolean);
    }

    // 🔹 2. Recept opslaan
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

    if (error) {
      console.error("Error saving recipe:", error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Nieuw Recept</h1>

        {success && (
          <div className="bg-green-100 text-green-800 p-3 rounded-lg">
            Recept succesvol opgeslagen ✅
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setImageFile(file);
                setPreviewUrl(URL.createObjectURL(file));
              }
            }}
            className="w-full border rounded-lg p-3 text-black"
          />

          {previewUrl && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-24 h-24 overflow-hidden rounded-lg border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-gray-600">
                Afbeelding geselecteerd
              </span>
            </div>
          )}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
          >
            <option value="">Selecteer categorie</option>
            <option value="ontbijt">Ontbijt</option>
            <option value="lunch">Lunch</option>
            <option value="diner">Diner</option>
            <option value="dessert">Dessert</option>
            <option value="snack">Snack</option>
          </select>

          <input
            type="number"
            placeholder="Kooktijd (minuten)"
            value={cookingTime ?? ""}
            onChange={(e) =>
              setCookingTime(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full border rounded-lg p-3 text-black"
          />
          <input
            type="number"
            placeholder="Aantal personen"
            value={servings ?? ""}
            onChange={(e) =>
              setServings(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full border rounded-lg p-3 text-black"
          />
          <textarea
            placeholder="Ingrediënten (één per regel)"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
          />

          <textarea
            placeholder="Bereiding (bij voorkeur genummerd: 1. 2. 3.)"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className="w-full border rounded-lg p-3 text-black"
          />

          <textarea
            placeholder="Extra notities"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg p-3 h-24 text-black"
          />

          <button
            onClick={handleSubmit}
            className="w-full bg-black text-white p-3 rounded-lg hover:opacity-90 transition"
          >
            Opslaan
          </button>
        </div>
      </div>
    </main>
  );
}
