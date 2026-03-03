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
      await supabase.auth.getSession();
      router.replace(redirectTo);
    };

    handleAuth();
  }, [redirectTo, router]);

  return <p className="p-6">Bezig met inloggen...</p>;
}
