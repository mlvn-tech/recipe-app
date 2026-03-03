"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const householdId = params.get("household");

  useEffect(() => {
    if (!householdId) return; // 🔥 eerst wachten tot param er is
    console.log("RAW searchParams:", params.toString());
    console.log("householdId param:", householdId);
    const joinHousehold = async () => {
      console.log("JOIN householdId:", householdId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      if (!existingMembership) {
        const response = await supabase.from("household_members").upsert(
          {
            household_id: householdId,
            user_id: user.id,
          },
          { onConflict: "user_id,household_id" },
        );

        console.log("JOIN RESPONSE:", response);
        console.log("JOIN user:", user);
        console.log("JOIN householdId:", householdId);

        if (response.error) {
          console.error(
            "JOIN ERROR FULL:",
            JSON.stringify(response.error, null, 2),
          );
          return;
        }
      }

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
