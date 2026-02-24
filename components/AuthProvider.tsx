"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousSession } from "@/lib/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await ensureAnonymousSession();
      setReady(true);
    };

    init();
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
