"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Icon from "@/components/icons";

type HeaderProps = {
  title: string;
  rightContent?: ReactNode;
  onBack?: () => void;
};

export default function Header({ title, rightContent, onBack }: HeaderProps) {
  const router = useRouter();

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-[var(--color-brand)] shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left */}
        <button onClick={() => (onBack ? onBack() : router.push("/"))}>
          <Icon icon={ChevronLeftIcon} className="text-white/80" />
        </button>

        {/* Titel echt gecentreerd */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1
            key={title}
            className="
              text-base 
              text-white
              font-semibold 
              max-w-[160px]
              truncate
              transition-all 
              duration-200
            "
          >
            {title}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">{rightContent}</div>
      </div>
    </div>
  );
}
