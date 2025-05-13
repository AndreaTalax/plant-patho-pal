
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';
import { EXPERT } from '../types';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateViewProps {
  onStartChat: () => void;
}

const EmptyStateView = ({ onStartChat }: EmptyStateViewProps) => {
  const { t } = useTheme();
  
  return (
    <div className="px-4">
      <h2 className="text-xl font-bold mb-4 text-drplant-green">{t("expertConsultation") || "Expert Consultation"}</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">{t("connectWithExperts") || "Connect with our experts to receive advice about your plants"}</p>
        
        <Card 
          key={EXPERT.id} 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={onStartChat}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={EXPERT.avatar} alt={EXPERT.name} />
            </Avatar>
            <div>
              <h3 className="font-medium">{EXPERT.name}</h3>
              <p className="text-sm text-gray-500">{EXPERT.specialty}</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </Card>
        
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>{t("responseTime") || "Our experts will respond within 24 hours"}</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateView;
