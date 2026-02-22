"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Icon from "@/components/icons";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
};

export default function Header({
  title,
  subtitle,
  rightContent,
  onBack,
  showBack = true,
}: HeaderProps) {
  const router = useRouter();

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-[var(--color-brand)] shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Left */}
        {showBack ? (
          <button onClick={() => (onBack ? onBack() : router.push("/"))}>
            <Icon icon={ChevronLeftIcon} className="text-white/80" />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {title && (
            <h1 className="text-base text-white font-semibold leading-tight">
              {title}
            </h1>
          )}

          {subtitle && (
            <span className="text-xs text-white/70 mt-0.5">{subtitle}</span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">{rightContent}</div>
      </div>
    </div>
  );
}
