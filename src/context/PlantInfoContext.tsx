
import React, { createContext, useState, useContext } from 'react';

export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI: boolean;
  infoComplete: boolean;
  sendToExpert?: boolean;
}

interface PlantInfoContextType {
  plantInfo: PlantInfo;
  setPlantInfo: React.Dispatch<React.SetStateAction<PlantInfo>>;
}

const initialPlantInfo: PlantInfo = {
  isIndoor: false,
  wateringFrequency: '',
  lightExposure: '',
  symptoms: '',
  useAI: false,
  infoComplete: false,
  sendToExpert: true,
};

const PlantInfoContext = createContext<PlantInfoContextType | undefined>(undefined);

export const PlantInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plantInfo, setPlantInfo] = useState<PlantInfo>(initialPlantInfo);

  return (
    <PlantInfoContext.Provider value={{ plantInfo, setPlantInfo }}>
      {children}
    </PlantInfoContext.Provider>
  );
};

export const usePlantInfo = () => {
  const context = useContext(PlantInfoContext);
  if (context === undefined) {
    throw new Error('usePlantInfo must be used within a PlantInfoProvider');
  }
  return context;
};
