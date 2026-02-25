"use client";
import { useState, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string;
  className?: string;
  overlay?: boolean;
  overflowVisible?: boolean;
};

export default function SwipeableSheet({
  open,
  onClose,
  title,
  children,
  height,
  className,
  overflowVisible = false,
  overlay = true,
}: Props) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);

  const onDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const onDragMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) setDragY(diff);
  };

  const onDragEnd = () => {
    setDragging(false);
    if (dragY > 80) onClose();
    setDragY(0);
  };

  return (
    <>
      {open && overlay && (
        <div className="fixed inset-0 z-110 bg-black/50" onClick={onClose} />
      )}

      <div
        className={`fixed left-0 w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.1)] z-110 flex flex-col 
        } ${className ?? ""}`}
        style={{
          bottom: 0,
          height: height === "auto" ? undefined : height,
          maxHeight: height === "auto" ? "90vh" : undefined,
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging
            ? "none"
            : "transform 0.3s ease-in-out, height 0.3s ease-in-out",
        }}
      >
        {/* Swipeable header */}
        <div
          className="touch-none shrink-0"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-center px-6 pt-8 pb-5">
            <h3 className="font-semibold">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex-1 ${overflowVisible ? "overflow-visible" : "overflow-y-auto"}`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
