
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI: boolean;
  sendToExpert: boolean;
  name: string;
  infoComplete: boolean;
  uploadedFile?: File | null;
  uploadedImageUrl?: string | null;
}

interface PlantInfoContextType {
  plantInfo: PlantInfo;
  setPlantInfo: (info: PlantInfo) => void;
  resetPlantInfo: () => void;
}

const defaultPlantInfo: PlantInfo = {
  isIndoor: true,
  wateringFrequency: '',
  lightExposure: '',
  symptoms: '',
  useAI: false,
  sendToExpert: false,
  name: '',
  infoComplete: false,
  uploadedFile: null,
  uploadedImageUrl: null
};

const PlantInfoContext = createContext<PlantInfoContextType | undefined>(undefined);

export const PlantInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [plantInfo, setPlantInfo] = useState<PlantInfo>(defaultPlantInfo);

  const resetPlantInfo = () => {
    setPlantInfo(defaultPlantInfo);
  };

  return (
    <PlantInfoContext.Provider value={{ plantInfo, setPlantInfo, resetPlantInfo }}>
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
