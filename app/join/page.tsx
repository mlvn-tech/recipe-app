"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const householdId = params.get("household");

  useEffect(() => {
    const joinHousehold = async () => {
      if (!householdId) {
        router.replace("/");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Niet ingelogd → eerst naar account
      if (!user) {
        router.replace("/account");
        return;
      }

      // 🔍 Check of user al lid is
      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("household_id", householdId)
        .maybeSingle();

      // ➕ Alleen toevoegen als nog geen membership
      if (!existingMembership) {
        const { error } = await supabase.from("household_members").upsert(
          {
            household_id: householdId,
            user_id: user.id,
          },
          { onConflict: "user_id,household_id" },
        );

        if (error) {
          console.error("JOIN ERROR:", error);
          return;
        }
      }

      // Klaar → naar homepage
      router.replace("/");
    };

    joinHousehold();
  }, [householdId, router]);

  return (
    <div className="p-6">
      <p>Je wordt toegevoegd aan het huishouden...</p>
    </div>
  );
}
