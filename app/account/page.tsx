"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const setupHousehold = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("USER:", user);

      if (!user) return;

      setUser(user);

      // check membership
      const { data: membership } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("MEMBERSHIP:", membership);

      if (!membership) {
        // create household
        console.log("NO MEMBERSHIP → CREATING HOUSEHOLD");
        const result = await supabase
          .from("households")
          .insert({ name: "Ons huishouden" })
          .select()
          .single();

        console.log("HOUSEHOLD RESULT:", result);

        if (result.error) {
          console.error("HOUSEHOLD ERROR:", result.error);
          return;
        }

        const household = result.data;

        if (household) {
          const memberResult = await supabase.from("household_members").insert({
            household_id: household.id,
            user_id: user.id,
          });

          console.log("MEMBER RESULT:", memberResult);
        }
      }
    };

    setupHousehold();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Account</h1>

      {user ? (
        <>
          <p className="mb-6 text-gray-600">{user.email}</p>

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
