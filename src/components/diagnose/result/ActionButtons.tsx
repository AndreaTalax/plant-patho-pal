
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PlantInfo {
  isIndoor: boolean;
  wateringFrequency: number;
  lightExposure: string;
  symptoms?: string;
}

interface ActionButtonsProps {
  onStartNewAnalysis: () => void;
  onChatWithExpert?: () => void;
  hasValidAnalysis: boolean;
  useAI?: boolean;
  plantImage?: string;
  plantInfo?: PlantInfo;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onStartNewAnalysis,
  onChatWithExpert,
  hasValidAnalysis,
  useAI = true,
  plantImage,
  plantInfo
}) => {
  const { isAuthenticated, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleChatWithExpert = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Check if user profile is complete
    if (!userProfile.firstName || !userProfile.lastName) {
      navigate('/complete-profile');
      return;
    }

    if (plantImage && plantInfo && !useAI) {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error("User not logged in");
          navigate('/auth');
          return;
        }

        // Create consultation record
        const { data: consultationData, error: consultationError } = await supabase
          .from('expert_consultations')
          .insert({
            user_id: user.id,
            symptoms: plantInfo.symptoms,
            image_url: plantImage,
            plant_info: {
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure
            },
            status: 'pending'
          })
          .select();
          
        if (consultationError) {
          console.error("Error creating consultation:", consultationError);
          return;
        }
        
        // Send notification to expert
        const consultationId = consultationData?.[0]?.id;
        if (consultationId) {
          // Invoke the edge function to notify the expert
          const { error: notifyError } = await supabase.functions.invoke('notify-expert', {
            body: { 
              consultationId,
              userId: user.id,
              imageUrl: plantImage,
              symptoms: plantInfo.symptoms,
              plantInfo: {
                isIndoor: plantInfo.isIndoor,
                wateringFrequency: plantInfo.wateringFrequency,
                lightExposure: plantInfo.lightExposure,
                symptoms: plantInfo.symptoms
              }
            }
          });
          
          if (notifyError) {
            console.error("Error notifying expert:", notifyError);
          }
        }
      } catch (error) {
        console.error("Error contacting expert:", error);
      }
    }
    
    // Call the onChatWithExpert function if provided
    if (onChatWithExpert) {
      onChatWithExpert();
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={onStartNewAnalysis}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>New Analysis</span>
      </Button>
      
      {hasValidAnalysis && (
        <Button 
          className="flex-1 bg-drplant-blue hover:bg-drplant-blue-dark"
          onClick={handleChatWithExpert}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>Ask Expert</span>
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
