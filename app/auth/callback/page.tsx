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
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );

      if (error) {
        console.error("Auth exchange error:", error);
        router.replace("/login");
        return;
      }

      router.replace(redirectTo);
    };

    handleAuth();
  }, [redirectTo, router]);

  return <p className="p-6">Bezig met inloggen...</p>;
}
