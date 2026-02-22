"use client";

import { useMemo } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";

export default function WeekPage() {
  const today = new Date();

  const weekLabel = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    })} – ${end.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    })}`;
  }, []);

  return (
    <>
      <Header title="Weekplanner" subtitle={weekLabel} showBack={false} />

      <main className="min-h-dvh bg-[var(--color-bg)] pt-16 pb-24">
        <div className="px-4 py-4 max-w-4xl mx-auto space-y-4">
          <Card>
            <h2 className="font-semibold text-lg mb-4">Geplande recepten</h2>

            <div className="text-gray-500 text-sm">
              Nog geen recepten toegevoegd voor deze week.
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-4">Boodschappenlijst</h2>

            <div className="text-gray-500 text-sm">
              Selecteer recepten om automatisch een lijst te genereren.
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
