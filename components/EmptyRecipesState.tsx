"use client";

import { useRouter } from "next/navigation";

export default function EmptyRecipesState({ category }: { category: string }) {
  const router = useRouter();

  const isAll = category === "Alles";

  return (
    <div className="flex flex-col items-center text-center py-6">
      {/* illustratie */}
      <img
        src="/empty-recipe.png"
        alt="Nog geen recepten"
        className="w-36 h-auto mb-4 opacity-90"
      />

      <p className="text-gray-700 mb-3">Hier staan nog geen recepten</p>

      <button
        onClick={() => router.push("/new")}
        className="text-sm text-[var(--color-accent)] font-medium"
      >
        {isAll
          ? "Maak snel je eerste recept aan!"
          : `Maak snel je eerste ${category.toLowerCase()} recept aan!`}
      </button>
    </div>
  );
}
