
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMobileEnhancements } from '@/hooks/useMobileEnhancements';

const ConnectionIndicator = () => {
  const { isOnline } = useMobileEnhancements();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Badge variant="destructive" className="flex items-center gap-2 px-3 py-1">
        <WifiOff className="h-4 w-4" />
        Modalità Offline
      </Badge>
    </div>
  );
};

export default ConnectionIndicator;
