"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const exchange = async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);

      router.replace("/");
    };

    exchange();
  }, []);

  return <p>Inloggen...</p>;
}
