"use client";

import { createContext, useContext, useState } from "react";

type UIContextType = {
  highlightCreate: boolean;
  setHighlightCreate: React.Dispatch<React.SetStateAction<boolean>>;
  createMenuOpen: boolean;
  setCreateMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [highlightCreate, setHighlightCreate] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        highlightCreate,
        setHighlightCreate,
        createMenuOpen,
        setCreateMenuOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used inside UIProvider");
  return context;
}
