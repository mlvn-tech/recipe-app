"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      // 🔓 Routes die niet beschermd moeten worden
      if (
        pathname === "/login" ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/join") ||
        pathname.startsWith("/recipe/share")
      ) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [router, pathname]);

  if (loading) return null;

  return <>{children}</>;
}
