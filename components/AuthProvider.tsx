"use client";
import { useEffect } from "react";
import { ensureAnonymousSession } from "@/lib/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    ensureAnonymousSession();
  }, []);

  return <>{children}</>;
}
