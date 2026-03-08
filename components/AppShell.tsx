"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/edit") ||
    pathname.includes("/new") ||
    pathname.includes("/cook") ||
    pathname.startsWith("/recipe/share");

  return (
    <>
      {children}
      {!hideNav && <BottomNav />}
    </>
  );
}
