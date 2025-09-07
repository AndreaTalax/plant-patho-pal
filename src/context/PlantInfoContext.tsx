
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string[];
  useAI: boolean;
  sendToExpert: boolean;
  name: string; // Made required
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
  symptoms: [],
  useAI: false,
  sendToExpert: false,
  name: '', // Default to empty string
  infoComplete: false,
  uploadedFile: null,
  uploadedImageUrl: null
};

const PlantInfoContext = createContext<PlantInfoContextType | undefined>(undefined);

/**
* Provides a context for managing plant information state with reset functionality.
* @example
* <PlantInfoProvider>
*   <YourComponent />
* </PlantInfoProvider>
* // Provides plant information and functions to components.
* @param {object} { children } - React components that will access PlantInfoContext.
* @returns {JSX.Element} Provider component with plantInfo context.
* @description
*   - Uses a default plant information object to initialize the context state.
*   - Allows components within its tree to access and update plant information.
*   - Includes a reset function to revert plant information to its default state.
*/
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
