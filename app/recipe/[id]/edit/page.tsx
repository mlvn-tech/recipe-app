"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Icon from "@/components/icons";
import { toast } from "sonner";
import Card from "@/components/Card";

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
  const [servings, setServings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFloatingSave, setShowFloatingSave] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteRef = useRef<HTMLDivElement | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const categories = ["Ontbijt", "Lunch", "Diner", "Dessert", "Snack"];

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

  useEffect(() => {
    const handleScroll = () => {
      if (!deleteRef.current) return;
      const rect = deleteRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight;
      setShowFloatingSave(!isVisible);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (data?.image_url) setImagePreview(data.image_url);

      if (data) {
        setTitle(data.title || "");
        setIngredients((data.ingredients || []).join("\n"));
        setSteps(
          (data.steps || [])
            .map((step: string, index: number) => `${index + 1}. ${step}`)
            .join("\n"),
        );
        setCategory(data.category || "");
        setCookingTime(data.cooking_time);
        setNotes(data.notes || "");
        setServings(data.servings);
      }

      setLoading(false);
    };

    if (id) fetchRecipe();
  }, [id]);

  const handleUpdate = async () => {
    const cleanedIngredients = ingredients
      .split("\n")
      .map((item) => item.trim().replace(/^[-•\s]+/, ""))
      .filter(Boolean);

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

    let imageUrl = imagePreview;

    if (imageFile) {
      if (imagePreview) {
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
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
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

  const SaveButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <button
      onClick={handleUpdate}
      className={`
        bg-[var(--color-accent)]/80
        border border-[var(--color-accent)]/80
        text-white
        py-4
        rounded-2xl
        shadow-lg
        text-md
        font-semibold
        active:scale-95
        transition
        ${fullWidth ? "w-full" : "px-8"}
      `}
    >
      Opslaan
    </button>
  );

  if (loading) {
    return <p className="p-8">Laden...</p>;
  }

  return (
    <>
      <Header title="Recept bewerken" onBack={() => router.back()} />

      <main className="min-h-screen bg-[var(--color-bg)] pt-20 pb-16">
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
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white/80 text-sm font-semibold tracking-wide">
                      Klik om afbeelding te wijzigen
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

          {/* Rest van je pagina blijft exact hetzelfde */}

          {/* Titel */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="
                w-full border border-gray-200 rounded-xl p-3
                bg-gray-50 text-[color:var(--color-text)]
                placeholder:text-gray-400
                focus:outline-none focus:border-gray-300 focus:bg-gray-50
                transition-colors
              "
            />
          </Card>

          {/* Meta */}
          <Card className="p-5 space-y-4">
            <div>
              <label className="text-sm text-gray-500 block mb-2">
                Aantal personen
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={servings ?? ""}
                onChange={(e) =>
                  setServings(e.target.value ? Number(e.target.value) : null)
                }
                className="
                  w-full border border-gray-200 rounded-xl p-3
                  bg-gray-50 text-[color:var(--color-text)]
                  focus:outline-none focus:border-gray-300 focus:bg-gray-50
                  transition-colors
                "
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">
                Kooktijd (minuten)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={cookingTime ?? ""}
                onChange={(e) =>
                  setCookingTime(e.target.value ? Number(e.target.value) : null)
                }
                className="
                  w-full border border-gray-200 rounded-xl p-3
                  bg-gray-50 text-[color:var(--color-text)]
                  focus:outline-none focus:border-gray-300 focus:bg-gray-50
                  transition-colors
                "
              />
            </div>

            {/* Dropdown */}
            <div ref={categoryRef} className="relative">
              <label className="text-sm text-gray-500 block mb-2">
                Categorie
              </label>
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="
                  w-full border border-gray-200 rounded-xl p-3
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
                  className={`text-gray-500 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`
                  absolute left-0 right-0 top-full mt-2
                  bg-white rounded-xl shadow-lg overflow-hidden z-50
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
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
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
          </Card>

          {/* Ingrediënten */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">
              Ingrediënten (één per regel)
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="
                w-full border border-gray-200 rounded-xl p-3
                bg-gray-50 focus:outline-none
                focus:border-gray-300 focus:bg-gray-50
                transition-colors min-h-[280px]
              "
            />
          </Card>

          {/* Bereiding */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">
              Bereiding
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="
                w-full border border-gray-200 rounded-xl p-3
                bg-gray-50 focus:outline-none
                focus:border-gray-300 focus:bg-gray-50
                transition-colors min-h-[280px]
              "
            />
          </Card>

          {/* Notities */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">Notities</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="
                w-full border border-gray-200 rounded-xl p-3
                bg-gray-50 focus:outline-none
                focus:border-gray-300 focus:bg-gray-50
                transition-colors min-h-30
              "
            />
          </Card>

          {/* Onderste sectie: opslaan + verwijderen */}
          <div ref={deleteRef} className="mt-6 space-y-3">
            <div
              className={`
                transition-all duration-300
                ${showFloatingSave ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}
              `}
            >
              <SaveButton fullWidth />
            </div>

            <button
              onClick={handleDelete}
              className="
                w-full
                border-2 border-red-300
                bg-red-50
                text-red-500
                py-4
                rounded-2xl
                text-md
                font-semibold
              "
            >
              Verwijderen
            </button>
          </div>
        </div>
      </main>

      {/* Floating opslaan knop */}
      <div
        className={`
          fixed bottom-12 left-1/2 -translate-x-1/2 z-50
          transition-all duration-300
          ${showFloatingSave ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <SaveButton />
      </div>
    </>
  );
}
