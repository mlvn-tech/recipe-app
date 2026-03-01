"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
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
