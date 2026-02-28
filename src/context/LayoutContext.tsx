import React, { createContext, useContext, useState } from "react";

export interface ContextPanelActions {
  onEdit?: () => void;
  onPrint?: () => void;
  relatedLinks?: { label: string; to: string }[];
}

interface LayoutContextValue {
  contextPanelActions: ContextPanelActions | null;
  setContextPanelActions: (actions: ContextPanelActions | null) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [contextPanelActions, setContextPanelActions] = useState<ContextPanelActions | null>(null);
  return (
    <LayoutContext.Provider value={{ contextPanelActions, setContextPanelActions }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const ctx = useContext(LayoutContext);
  return ctx;
}
