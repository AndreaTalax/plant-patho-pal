
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className }) => {
  const { t } = useTheme();
  // Mostra al massimo 70%
  const displayConfidence = Math.min(70, Math.round(confidence));

  const getConfidenceBadge = (value: number) => {
    if (value >= 90) {
      return <Badge className={`bg-green-600 text-white ${className}`}>{t('veryHighReliability')} ({value}%)</Badge>;
    } else if (value >= 75) {
      return <Badge className={`bg-blue-600 text-white ${className}`}>{t('highReliability')} ({value}%)</Badge>;
    } else if (value >= 60) {
      return <Badge className={`bg-yellow-600 text-white ${className}`}>{t('mediumReliability')} ({value}%)</Badge>;
    } else {
      return <Badge className={`bg-red-600 text-white ${className}`}>{t('lowReliability')} ({value}%)</Badge>;
    }
  };

  return getConfidenceBadge(displayConfidence);
};
