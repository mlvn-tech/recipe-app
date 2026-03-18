"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureAnonymousSession } from "@/lib/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Wacht tot Supabase de sessie heeft hersteld (inclusief token refresh)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        await ensureAnonymousSession();
      }

      setReady(true);
    };

    // Luister naar auth state changes — belangrijk na iOS background kill
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        setReady(true);
      }
      if (event === "SIGNED_OUT") {
        setReady(false);
      }
    });

    init();

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
