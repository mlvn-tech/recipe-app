"use client";

import { createContext, useContext, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

const OverlayContext = createContext({
  show: () => {},
  hide: () => {},
});

export function useOverlay() {
  return useContext(OverlayContext);
}

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <OverlayContext.Provider
      value={{
        show: () => setVisible(true),
        hide: () => setVisible(false),
      }}
    >
      {children}

      {visible && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-8 shadow-xl flex flex-col items-center gap-6">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
            <p className="text-sm font-medium">Je recept wordt opgeslagen...</p>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}
