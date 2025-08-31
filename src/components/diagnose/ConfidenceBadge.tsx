
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className }) => {
  // Mostra al massimo 70%
  const displayConfidence = Math.min(70, Math.round(confidence));

  const getConfidenceBadge = (value: number) => {
    if (value >= 90) {
      return <Badge className={`bg-green-600 text-white ${className}`}>Altissima Affidabilità ({value}%)</Badge>;
    } else if (value >= 75) {
      return <Badge className={`bg-blue-600 text-white ${className}`}>Alta Affidabilità ({value}%)</Badge>;
    } else if (value >= 60) {
      return <Badge className={`bg-yellow-600 text-white ${className}`}>Media Affidabilità ({value}%)</Badge>;
    } else {
      return <Badge className={`bg-red-600 text-white ${className}`}>Bassa Affidabilità ({value}%)</Badge>;
    }
  };

  return getConfidenceBadge(displayConfidence);
};
