"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const setupHousehold = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      // check membership
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        setHouseholdId(membership.household_id);
      }

      if (!membership) {
        const result = await supabase
          .from("households")
          .insert({ name: "Ons huishouden" })
          .select()
          .maybeSingle();

        if (result.error) {
          console.error("HOUSEHOLD ERROR:", result.error);
          return;
        }

        const household = result.data;

        if (household) {
          await supabase.from("household_members").upsert(
            {
              household_id: householdId,
              user_id: user.id,
            },
            { onConflict: "user_id,household_id" },
          );

          setHouseholdId(household.id);
        }
      }
    };

    setupHousehold();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const inviteLink =
    householdId && typeof window !== "undefined"
      ? `${window.location.origin}/join?household=${householdId}`
      : "";

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Account</h1>

      {user ? (
        <>
          <p className="mb-4 text-gray-600">{user.email}</p>

          {householdId && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                Nodig iemand uit met deze link:
              </p>
              <input
                readOnly
                value={inviteLink}
                className="w-full p-2 bg-gray-100 rounded-lg text-sm"
              />
            </div>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-100 rounded-lg"
          >
            Uitloggen
          </button>
        </>
      ) : (
        <p>Niet ingelogd</p>
      )}
    </div>
  );
}
