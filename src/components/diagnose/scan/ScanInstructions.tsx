
import React from 'react';
import { CheckCircle, Camera, Sun, Focus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';

const ScanInstructions = () => {
  const { t } = useTheme();
  
  const instructions = [
    {
      icon: Sun,
      title: t('goodLighting'),
      description: t('goodLightingDesc')
    },
    {
      icon: Focus,
      title: t('clearFocus'),
      description: t('clearFocusDesc')
    },
    {
      icon: Camera,
      title: t('showBackground'),
      description: t('showBackgroundDesc')
    },
    {
      icon: CheckCircle,
      title: t('multipleAngles'),
      description: t('multipleAnglesDesc')
    }
  ];

  return (
    <Card className="p-6 mb-8 bg-card border-border">
      <h2 className="text-xl font-semibold mb-4 text-center text-foreground">{t('tipsForBestResults')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instructions.map((instruction, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-success/10 p-2 rounded-full flex-shrink-0">
              <instruction.icon className="h-4 w-4 text-success" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">{instruction.title}</h3>
              <p className="text-xs text-muted-foreground">{instruction.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScanInstructions;
