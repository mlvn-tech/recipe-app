"use client";
import { styles } from "@/lib/styles";
import clsx from "clsx";
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
  const [selectedServings, setSelectedServings] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState("Diner");

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
      className={`${styles.button.save} ${fullWidth ? "w-full" : "px-8"}`}
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
              className={styles.input.default}
            />
          </Card>

          {/* Meta */}
          <Card className="p-5 space-y-4">
            {/* Dropdown */}
            {/* Aantal + Categorie naast elkaar */}
            <div className="flex gap-4 mt-4">
              {/* Aantal */}
              <div className="flex flex-col gap-2 w-16">
                <label className="block text-sm font-medium">Porties</label>

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
                <label className="block text-sm font-medium">Categorie</label>

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
                className={styles.input.default}
              />
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
              className={`${styles.input.default} min-h-[280px]`}
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
              className={`${styles.input.default} min-h-[280px]`}
            />
          </Card>

          {/* Notities */}
          <Card className="p-5">
            <label className="text-sm text-gray-500 block mb-2">Notities</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${styles.input.default} min-h-[30px]`}
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

            <button onClick={handleDelete} className={styles.button.delete}>
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
