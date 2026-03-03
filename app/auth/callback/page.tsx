"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("AUTH CALLBACK ERROR:", error);
        router.replace("/login");
        return;
      }

      if (!data?.session) {
        router.replace("/login");
        return;
      }

      router.replace(redirectTo);
    };

    handleAuth();
  }, [redirectTo, router]);

  return <p className="p-6">Bezig met inloggen...</p>;
}
