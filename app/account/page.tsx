"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMembership = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        setHouseholdId(membership.household_id);
      }
    };

    fetchMembership();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const inviteLink =
    householdId && typeof window !== "undefined"
      ? `${window.location.origin}/join?household=${householdId}`
      : "";

  const handleCreateHousehold = async () => {
    if (!user) return;

    const { data: household, error } = await supabase
      .from("households")
      .insert({ name: "Ons huishouden" })
      .select()
      .single();

    if (error) {
      console.error("CREATE HOUSEHOLD ERROR:", error);
      return;
    }

    await supabase.from("household_members").insert({
      household_id: household.id,
      user_id: user.id,
    });

    setHouseholdId(household.id);
  };

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
          {!householdId && user && (
            <button
              onClick={handleCreateHousehold}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Maak nieuw huishouden
            </button>
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
