"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Laat Supabase de hash verwerken
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      router.replace("/");
    };

    handleAuth();
  }, [router]);

  return <p className="p-6">Bezig met inloggen...</p>;
}
