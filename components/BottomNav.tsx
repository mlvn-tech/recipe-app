"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  CalendarDaysIcon,
  PlusCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import Icon from "@/components/icons";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    {
      label: "Home",
      href: "/",
      icon: HomeIcon,
      iconActive: HomeIconSolid,
    },
    {
      label: "Week",
      href: "/week",
      icon: CalendarDaysIcon,
      iconActive: CalendarDaysIconSolid,
    },
    {
      label: "Nieuw",
      href: "/new",
      icon: PlusCircleIcon,
      iconActive: PlusCircleIcon,
    },
    {
      label: "Account",
      href: "/account",
      icon: UserIcon,
      iconActive: UserIconSolid,
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 w-full backdrop-blur-xl bg-white/70 border-t border-gray-200 z-[120]"
      style={{
        height: "calc(64px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-4xl mx-auto flex justify-around h-16 items-center">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/week" && pathname.startsWith("/shopping"));

          const IconComponent = isActive ? item.iconActive : item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center flex-1"
            >
              <Icon
                icon={IconComponent}
                size={24}
                className={`transition-colors ${
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
