
import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface DiagnoseHeaderProps {
  showModelInfo: boolean;
  onToggleModelInfo: () => void;
}

/**
 * Render the Diagnose Header component which displays the title and a button for toggling model information.
...
 */
const DiagnoseHeader: React.FC<DiagnoseHeaderProps> = ({ showModelInfo, onToggleModelInfo }) => {
  const { t } = useTheme();
  
  return (
    <>
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-2xl font-bold text-drplant-green">{t('plantIdentification')}</h2>
        <div className="flex items-center bg-blue-50 text-blue-600 rounded-full px-3 py-0.5 text-xs mt-1">
          <span className="font-semibold mr-1">{t('poweredBy')}</span> 
          <span className="font-bold">Dr.Plant™ AI</span>
        </div>
        <p className="text-sm text-gray-500 text-center mt-2 max-w-xs">
          {t('forBestResults')}
        </p>
      </div>
      
      <div className="w-full max-w-md flex justify-end mb-4">
        <button
          onClick={onToggleModelInfo}
          className="text-sm text-drplant-blue hover:text-drplant-blue-dark flex items-center gap-1"
        >
          <span>{showModelInfo ? t('hideAIInfo') : t('showAIInfo')}</span>
        </button>
      </div>
    </>
  );
};

export default DiagnoseHeader;
