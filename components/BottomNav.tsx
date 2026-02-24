"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  CalendarDaysIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
} from "@heroicons/react/24/solid";
import Icon from "@/components/icons";
import { useUI } from "./UIContext";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { highlightCreate } = useUI(); // 👈 hier toevoegen

  const items = [
    {
      label: "Home",
      href: "/",
      icon: HomeIcon,
      iconActive: HomeIconSolid,
    },
    {
      label: "Nieuw",
      href: "/new",
      icon: PlusIcon,
      iconActive: PlusIcon,
    },
    {
      label: "Week",
      href: "/week",
      icon: CalendarDaysIcon,
      iconActive: CalendarDaysIconSolid,
    },
  ];

  return (
    <div
      className="
        fixed bottom-0 left-0 w-full
        backdrop-blur-xl bg-white/70
        border-t border-gray-200
        z-120
        pb-safe
      "
    >
      <div className="max-w-4xl mx-auto flex justify-around py-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/week" && pathname.startsWith("/shopping"));

          const IconComponent = isActive ? item.iconActive : item.icon;

          // 🎯 Speciale styling voor + knop
          if (item.href === "/new") {
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  flex items-center justify-center
                  bg-[var(--color-accent)]/80
                  rounded-lg
                  w-8 h-8
                  active:scale-95
                  transition-transform
                  ${highlightCreate ? "animate-pulse-cta" : ""}
                `}
              >
                <Icon icon={PlusIcon} size={24} className="text-white" />
              </button>
            );
          }

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center"
            >
              <Icon
                icon={IconComponent}
                size={28}
                className={`${
                  isActive ? "text-gray-500" : "text-gray-400"
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
