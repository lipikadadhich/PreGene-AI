import { createContext, useContext, useState } from "react";
import { Disease } from "../types/disease";

interface DiseaseContextType {
  selectedDisease: Disease | null;
  setSelectedDisease: (disease: Disease | null) => void;
}

const DiseaseContext = createContext<DiseaseContextType | undefined>(undefined);

export function DiseaseProvider({ children }: { children: React.ReactNode }) {
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);

  return (
    <DiseaseContext.Provider
      value={{
        selectedDisease,
        setSelectedDisease,
      }}
    >
      {children}
    </DiseaseContext.Provider>
  );
}

export function useDisease() {
  const context = useContext(DiseaseContext);

  if (!context) {
    throw new Error("useDisease must be used inside DiseaseProvider");
  }

  return context;
}