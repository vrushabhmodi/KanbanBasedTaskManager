import { createContext, useContext, useMemo, useState } from "react";

type SelectionModeContextType = {
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
};

const SelectionModeContext = createContext<SelectionModeContextType | null>(null);

export function SelectionModeProvider({ children }: { children: React.ReactNode }) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const value = useMemo(
    () => ({ isSelectionMode, setIsSelectionMode }),
    [isSelectionMode]
  );

  return (
    <SelectionModeContext.Provider value={value}>
      {children}
    </SelectionModeContext.Provider>
  );
}

export function useSelectionMode() {
  const context = useContext(SelectionModeContext);
  if (!context) {
    throw new Error("useSelectionMode must be used within a SelectionModeProvider");
  }
  return context;
}