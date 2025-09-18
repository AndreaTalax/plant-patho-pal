import React from 'react';
import PlantIdentificationComponent from '@/components/plant/PlantIdentificationComponent';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PlantIdentification = () => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/plan-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 py-8">
      <div className="container mx-auto px-4">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-drplant-blue-dark hover:text-drplant-green"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>

        {/* Main Content */}
        <PlantIdentificationComponent onUpgrade={handleUpgrade} />
      </div>
    </div>
  );
};

export default PlantIdentification;