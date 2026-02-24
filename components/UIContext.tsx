"use client";

import { createContext, useContext, useState } from "react";

type UIContextType = {
  highlightCreate: boolean;
  setHighlightCreate: (value: boolean) => void;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [highlightCreate, setHighlightCreate] = useState(false);

  return (
    <UIContext.Provider value={{ highlightCreate, setHighlightCreate }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used inside UIProvider");
  return context;
}
