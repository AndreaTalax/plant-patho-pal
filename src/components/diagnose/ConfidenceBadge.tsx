import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className }) => {
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge className={`bg-green-600 text-white ${className}`}>Altissima Affidabilità ({confidence}%)</Badge>;
    } else if (confidence >= 75) {
      return <Badge className={`bg-blue-600 text-white ${className}`}>Alta Affidabilità ({confidence}%)</Badge>;
    } else if (confidence >= 60) {
      return <Badge className={`bg-yellow-600 text-white ${className}`}>Media Affidabilità ({confidence}%)</Badge>;
    } else {
      return <Badge className={`bg-red-600 text-white ${className}`}>Bassa Affidabilità ({confidence}%)</Badge>;
    }
  };

  return getConfidenceBadge(confidence);
};