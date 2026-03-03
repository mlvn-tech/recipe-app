"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JoinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const householdId = params.get("household");

  const [status, setStatus] = useState("Bezig met toevoegen...");

  useEffect(() => {
    const joinHousehold = async () => {
      if (!householdId) {
        setStatus("Geen geldige uitnodiging.");
        return;
      }

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("AUTH ERROR:", error);
        setStatus("Authenticatie fout.");
        return;
      }

      if (!data?.user) {
        setStatus("Je moet eerst inloggen.");
        router.replace("/login");
        return;
      }

      const user = data.user;

      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("household_id", householdId)
        .maybeSingle();

      if (!existingMembership) {
        const { error: insertError } = await supabase
          .from("household_members")
          .insert({
            household_id: householdId,
            user_id: user.id,
          });

        if (insertError) {
          console.error("JOIN ERROR:", insertError);
          setStatus("Er ging iets mis bij toevoegen.");
          return;
        }
      }

      setStatus("Succes! Je wordt doorgestuurd...");
      setTimeout(() => {
        router.replace("/");
      }, 1500);
    };

    joinHousehold();
  }, [householdId, router]);

  return (
    <div className="p-6">
      <p>{status}</p>
    </div>
  );
}
