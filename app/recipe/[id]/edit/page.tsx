"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EditRecipe() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState<number | null>(null);

  const handleDelete = async () => {
    const confirmed = confirm(
      "Weet je zeker dat je dit recept wilt verwijderen?",
    );

    if (!confirmed) return;

    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (!error) {
      router.push("/");
    } else {
      console.error("Delete error:", error);
    }
  };

  // 🔹 Recept ophalen
  useEffect(() => {
    const fetchRecipe = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setServings(data.servings);
        setTitle(data.title || "");
        setIngredients((data.ingredients || []).join("\n"));
        setSteps((data.steps || []).join("\n"));
        setCategory(data.category || "");
        setCookingTime(data.cooking_time);
        setNotes(data.notes || "");
      }

      setLoading(false);
    };

    if (id) fetchRecipe();
  }, [id]);

  const handleUpdate = async () => {
    // 🥬 Ingrediënten opschonen
    const cleanedIngredients = ingredients
      .split("\n")
      .map(
        (item) => item.trim().replace(/^[-•\s]+/, ""), // verwijdert - of • aan begin
      )
      .filter(Boolean);

    // 🧑‍🍳 Stappen slim opsplitsen
    let cleanedSteps: string[] = [];

    if (/\d+\.\s/.test(steps)) {
      cleanedSteps = steps
        .trim()
        .split(/\n?\d+\.\s+/)
        .filter(Boolean);
    } else {
      cleanedSteps = steps
        .split(/\n\s*\n/)
        .map((step) => step.trim())
        .filter(Boolean);
    }

    const { error } = await supabase
      .from("recipes")
      .update({
        title,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        category,
        cooking_time: cookingTime,
        servings,
        notes,
      })
      .eq("id", id);

    if (!error) {
      router.push(`/recipe/${id}`);
    } else {
      console.error("Update error:", error);
    }
  };

  if (loading) {
    return <p className="p-8">Laden...</p>;
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Recept bewerken</h1>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="w-full border rounded-lg p-3 h-32 text-black"
        />

        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="w-full border rounded-lg p-3 h-40 text-black"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg p-3 h-24 text-black"
        />

        <button
          onClick={handleUpdate}
          className="w-full bg-black text-white p-3 rounded-lg"
        >
          Wijzigingen opslaan
        </button>
        <button
          onClick={handleDelete}
          className="
    w-full
    border
    border-red-300
    text-red-600
    p-3
    rounded-lg
    hover:bg-red-50
    transition
  "
        >
          Recept verwijderen
        </button>
      </div>
    </main>
  );
}
