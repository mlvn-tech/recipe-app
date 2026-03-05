"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/edit") ||
    pathname.includes("/new") ||
    pathname.includes("/cook");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      className="flex flex-col"
    >
      <div className="flex-1 overflow-y-auto">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
