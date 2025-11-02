
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ScanHeader = () => {
  const { t } = useTheme();
  
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="bg-background/50 p-3 rounded-full">
          <img 
            src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
            alt="Dr.Plant Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {t('plantHealthScanner')}
      </h1>
      <p className="text-lg text-gray-600 mb-4">
        {t('instantlyIdentify')}
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
        <Sparkles className="h-4 w-4" />
        <span>{t('poweredByAI')}</span>
      </div>
    </div>
  );
};

export default ScanHeader;
