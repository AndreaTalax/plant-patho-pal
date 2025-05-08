
import { createContext, useContext, useState, ReactNode } from "react";

type PlantInfo = {
  isIndoor: boolean;
  inSunlight: boolean;
  wateringFrequency: string;
  infoComplete: boolean;
};

type PlantInfoContextType = {
  plantInfo: PlantInfo;
  setPlantInfo: (info: Partial<PlantInfo>) => void;
  resetPlantInfo: () => void;
};

const defaultPlantInfo: PlantInfo = {
  isIndoor: false,
  inSunlight: false,
  wateringFrequency: "",
  infoComplete: false,
};

const PlantInfoContext = createContext<PlantInfoContextType | undefined>(undefined);

export const PlantInfoProvider = ({ children }: { children: ReactNode }) => {
  const [plantInfo, setPlantInfoState] = useState<PlantInfo>(() => {
    const savedInfo = localStorage.getItem("plant-info");
    return savedInfo ? JSON.parse(savedInfo) : defaultPlantInfo;
  });

  const setPlantInfo = (info: Partial<PlantInfo>) => {
    const newInfo = { ...plantInfo, ...info };
    setPlantInfoState(newInfo);
    localStorage.setItem("plant-info", JSON.stringify(newInfo));
  };

  const resetPlantInfo = () => {
    setPlantInfoState(defaultPlantInfo);
    localStorage.removeItem("plant-info");
  };

  return (
    <PlantInfoContext.Provider
      value={{
        plantInfo,
        setPlantInfo,
        resetPlantInfo,
      }}
    >
      {children}
    </PlantInfoContext.Provider>
  );
};

export const usePlantInfo = () => {
  const context = useContext(PlantInfoContext);
  if (context === undefined) {
    throw new Error("usePlantInfo must be used within a PlantInfoProvider");
  }
  return context;
};
