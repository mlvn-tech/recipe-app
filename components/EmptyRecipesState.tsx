"use client";

import { useRouter } from "next/navigation";

export default function EmptyRecipesState({ category }: { category: string }) {
  const router = useRouter();

  const isAll = category === "Alles";

  return (
    <div className="text-center py-12">
      {isAll ? (
        <>
          <p className="text-gray-700 mb-3">Hier staan nog geen recepten</p>
          <button
            onClick={() => router.push("/new")}
            className="text-sm text-[var(--color-accent)] font-medium"
          >
            Maak snel je eerste recept aan!
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-700 mb-3">Hier staan nog geen recepten</p>
          <button
            onClick={() => router.push("/new")}
            className="text-sm text-[var(--color-accent)] font-medium"
          >
            Maak snel je eerste {category.toLowerCase()} recept aan!
          </button>
        </>
      )}
    </div>
  );
}
