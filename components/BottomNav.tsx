"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUI } from "@/components/UIContext";
import clsx from "clsx";

import {
  Utensils,
  CalendarDays,
  PlusCircle,
  User,
  PenLine,
  WandSparkles,
} from "lucide-react";

import Icon from "@/components/icons";

export default function BottomNav() {
  const { createMenuOpen, setCreateMenuOpen } = useUI();

  const pathname = usePathname();
  const router = useRouter();

  const items = [
    {
      label: "Recepten",
      href: "/",
      icon: Utensils,
      iconActive: Utensils,
    },
    {
      label: "Week",
      href: "/week",
      icon: CalendarDays,
      iconActive: CalendarDays,
    },
    { label: "Nieuw", href: "/new", icon: PlusCircle, iconActive: PlusCircle },
    { label: "Account", href: "/account", icon: User, iconActive: User },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 w-full backdrop-blur-xl bg-white/70 z-[120] border-t border-gray-100"
      style={{
        height: "calc(64px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-4xl mx-auto flex justify-around h-16 items-center">
        {items.map((item) => {
          const isActive =
            item.label === "Nieuw"
              ? createMenuOpen ||
                pathname === "/ai" ||
                pathname === "/recipe/preview"
              : !createMenuOpen &&
                (pathname === item.href ||
                  (item.href === "/" && pathname.startsWith("/recipe")) ||
                  (item.href === "/week" && pathname.startsWith("/shopping")));

          const isRotated = item.label === "Nieuw" && createMenuOpen;

          const IconComponent = isActive ? item.iconActive : item.icon;

          // 🔹 SPECIALE WRAPPER VOOR NIEUW
          if (item.label === "Nieuw") {
            return (
              <div
                key={item.href}
                className="relative flex flex-col items-center justify-center flex-1"
              >
                <div
                  className={clsx(
                    "absolute flex flex-col gap-2 items-center w-36 z-[130] transition-all duration-200 ease-out",
                    createMenuOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-4 pointer-events-none",
                  )}
                  style={{
                    bottom: "calc(4rem + env(safe-area-inset-bottom))",
                  }}
                >
                  <button
                    onClick={() => {
                      setCreateMenuOpen(false);
                      router.push("/ai");
                    }}
                    className="shadow-[0_8px_30px_rgba(0,0,0,0.12)] floating-blur bg-white/95 w-full px-4 py-4 rounded-full shadow text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <WandSparkles
                      size={16}
                      className="text-[var(--color-purple-400)]"
                    />
                    Koken met AI
                  </button>

                  <button
                    onClick={() => {
                      setCreateMenuOpen(false);
                      router.push("/new");
                    }}
                    className="shadow-[0_8px_30px_rgba(0,0,0,0.12)] floating-blur bg-white/95 w-full px-4 py-4 rounded-full shadow text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <PenLine
                      size={16}
                      className="text-[var(--color-purple-400)]"
                    />
                    Zelf maken
                  </button>
                </div>

                <button
                  onClick={() => setCreateMenuOpen((prev) => !prev)}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <div
                    className={`transition-transform duration-200 ${
                      isRotated ? "rotate-45" : "rotate-0"
                    }`}
                    style={{
                      transformOrigin: "center",
                      width: "24px",
                      height: "24px",
                    }}
                  >
                    <Icon
                      icon={IconComponent}
                      size={24}
                      strokeWidth={2}
                      className={`transition-colors duration-200 ${
                        isActive
                          ? "text-[var(--color-accent)]"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs mt-1 transition-colors h-4 ${
                      isActive ? "text-[var(--color-accent)]" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.href}
              onClick={() => {
                setCreateMenuOpen(false);

                if (pathname === item.href && item.href === "/") {
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                  return;
                }

                router.push(item.href);
              }}
              className="flex flex-col items-center justify-center flex-1"
            >
              <Icon
                icon={IconComponent}
                size={24}
                strokeWidth={2}
                className={`transition-colors duration-200 ${
                  isActive ? "text-[var(--color-accent)]" : "text-gray-500"
                }`}
              />

              <span
                className={`text-xs mt-1 transition-colors ${
                  isActive ? "text-[var(--color-accent)]" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
