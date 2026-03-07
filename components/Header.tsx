"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Icon from "@/components/icons";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  showClose?: boolean;
};

export default function Header({
  title,
  subtitle,
  rightContent,
  onBack,
  showBack = true,
  showClose = false,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 bg-[var(--color-brand)] shadow-[0_1px_6px_rgba(0,0,0,0.05)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Left */}
        <div className="w-8 flex justify-start">
          {showBack && !showClose && (
            <button onClick={handleBack}>
              <Icon icon={ChevronLeftIcon} className="text-white/80" />
            </button>
          )}

          {showClose && (
            <button onClick={handleBack}>
              <Icon icon={XMarkIcon} className="text-white/80" />
            </button>
          )}
        </div>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {title && (
            <h2 className="text-base font-semibold leading-tight truncate max-w-[240px] !text-white">
              {title}
            </h2>
          )}

          {subtitle && (
            <span className="text-xs text-white/70 mt-0.5">{subtitle}</span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 w-8 justify-end">
          {rightContent}
        </div>
      </div>
    </div>
  );
}
