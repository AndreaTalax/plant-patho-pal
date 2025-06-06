
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  MessageSquare,
  Leaf,
  Activity,
  Database
} from 'lucide-react';
import { PlantAnalysisResult } from '@/services/realPlantAnalysisService';
import { useNavigate } from 'react-router-dom';

interface PlantAnalysisResultProps {
  analysisResult: PlantAnalysisResult;
  imageUrl: string;
  onNewAnalysis: () => void;
  autoSentToExpert?: boolean;
}

const PlantAnalysisResultComponent: React.FC<PlantAnalysisResultProps> = ({
  analysisResult,
  imageUrl,
  onNewAnalysis,
  autoSentToExpert = false
}) => {
  const navigate = useNavigate();

  const handleGoToChat = () => {
    navigate('/');
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'chat' });
      window.dispatchEvent(event);
    }, 100);
  };

  const confidenceColor = analysisResult.confidence >= 0.8 
    ? 'bg-green-500' 
    : analysisResult.confidence >= 0.6 
    ? 'bg-yellow-500' 
    : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Section */}
          <div className="lg:w-1/3">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Analyzed plant" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Analysis Results */}
          <div className="lg:w-2/3">
            <div className="flex items-center gap-2 mb-4">
              {analysisResult.isHealthy ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              )}
              <h2 className="text-2xl font-bold">
                {analysisResult.plantName}
              </h2>
              <Badge className={`${confidenceColor} text-white`}>
                {Math.round(analysisResult.confidence * 100)}% confidence
              </Badge>
            </div>

            {analysisResult.scientificName && (
              <p className="text-gray-600 italic mb-4">
                {analysisResult.scientificName}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <span className="text-sm">
                  Status: {analysisResult.isHealthy ? 'Healthy' : 'Issues Detected'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-sm">
                  AI Confidence: {Math.round(analysisResult.confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                <span className="text-sm">Real API Analysis</span>
              </div>
            </div>

            {/* Health Status */}
            <div className={`p-4 rounded-lg mb-4 ${
              analysisResult.isHealthy 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <h3 className="font-semibold mb-2">
                {analysisResult.isHealthy ? 'Plant Appears Healthy' : 'Potential Issues Detected'}
              </h3>
              <p className="text-sm">
                {analysisResult.isHealthy 
                  ? 'The AI analysis indicates your plant is in good health. Continue with regular care and monitoring.'
                  : 'The analysis has detected potential issues. Professional consultation is recommended for accurate treatment.'}
              </p>
            </div>

            {/* Diseases Section */}
            {analysisResult.diseases && analysisResult.diseases.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-800 mb-3">Detected Issues:</h3>
                <div className="space-y-2">
                  {analysisResult.diseases.map((disease, index) => (
                    <div key={index} className="bg-white rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{disease.name}</h4>
                        <Badge variant="outline">
                          {Math.round(disease.probability * 100)}% probability
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{disease.description}</p>
                      <p className="text-sm font-medium">Treatment: {disease.treatment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Expert Consultation Status */}
      {autoSentToExpert && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Expert Consultation Initiated</h3>
                <p className="text-sm text-blue-600">
                  Your diagnosis has been automatically sent to our phytopathologist expert
                </p>
              </div>
            </div>
            <Button onClick={handleGoToChat} variant="outline" size="sm">
              Go to Chat
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onNewAnalysis} variant="outline" className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" />
          Analyze Another Plant
        </Button>
        
        <Button onClick={handleGoToChat} className="flex-1">
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat with Expert
        </Button>
      </div>

      {/* API Sources Footer */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium mb-2">Analysis powered by:</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Plant.id API</Badge>
          <Badge variant="secondary">Hugging Face AI</Badge>
          <Badge variant="secondary">EPPO Database</Badge>
        </div>
      </Card>
    </div>
  );
};

export default PlantAnalysisResultComponent;
