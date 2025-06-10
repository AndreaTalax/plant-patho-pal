
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';
import { EXPERT } from '../types';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateViewProps {
  onStartChat: () => void;
}

/**
 * Render a view with information and a clickable card that initiates a chat with a plant expert.
 * @example
 * ({ onStartChat }) => { ... }
 * <div className="px-4">...</div>
 * @param {function} onStartChat - Callback function to start a chat when the expert card is clicked.
 * @returns {JSX.Element} Returns a JSX element containing an empty state view with expert information.
 * @description
 *   - Uses translation functionality to provide localized strings with fallback options.
 *   - The expert information is contained within a clickable card component styled with hover effects.
 *   - An avatar image is displayed for the expert, with a fallback for initials if the image is not available.
 *   - Displays a default message about the expert’s response time.
 */
const EmptyStateView = ({ onStartChat }: EmptyStateViewProps) => {
  const { t } = useTheme();
  
  return (
    <div className="px-4">
      <h2 className="text-xl font-bold mb-4 text-drplant-green">{t("expertConsultation") || "Consulenza Esperto"}</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">{t("connectWithExperts") || "Connettiti con il nostro esperto per ricevere consigli sulle tue piante"}</p>
        
        <Card 
          key={EXPERT.id} 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={onStartChat}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={EXPERT.avatar} alt={EXPERT.name} />
              <AvatarFallback>MN</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{EXPERT.name}</h3>
              <p className="text-sm text-gray-500">{EXPERT.specialty}</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </Card>
        
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>{t("responseTime") || "Il nostro esperto risponderà entro 24 ore"}</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateView;
