"use client";

import { useEffect, useState, RefObject } from "react";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";

type HeroHeaderProps = {
  title: string;
  onBack: () => void;
  rightContent?: React.ReactNode;
  heroRef?: RefObject<HTMLDivElement | null>;
};

export default function HeroHeader({
  title,
  heroRef,
  onBack,
  rightContent,
}: HeroHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef?.current) return;

      // Zorg dat header nooit zichtbaar is op paginalanding
      if (window.scrollY === 0) {
        setVisible(false);
        return;
      }

      const rect = heroRef.current.getBoundingClientRect();

      if (rect.top <= 80) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroRef]);

  return (
    <div
      ref={heroRef}
      className={clsx(
        "fixed left-0 right-0 z-50 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 h-12 flex items-center justify-between px-4">
        {/* Chevron */}
        <button onClick={onBack} className="text-gray-600">
          <ChevronLeft size={20} />
        </button>

        {/* Titel */}
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold truncate max-w-[55%] text-center text-gray-900">
          {title}
        </span>

        {/* Acties */}
        <div className="flex items-center gap-4 text-gray-600">
          {rightContent}
        </div>
      </div>
    </div>
  );
}
