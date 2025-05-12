
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModelInfoProps {
  modelInfo: {
    framework: string;
    baseModel: string;
    dataset: string;
    datasetSize: string;
    dataAugmentation: string[];
    accuracy: string;
    classes: number;
    trainTime: string;
    lastUpdated: string;
  };
  onClose: () => void;
}

const ModelInfoPanel = ({ modelInfo, onClose }: ModelInfoProps) => {
  return (
    <Card className="bg-white p-6 shadow-lg rounded-xl w-full max-w-md mb-6 relative">
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        <X size={18} />
      </button>
      
      <div className="flex items-center mb-4">
        <div className="bg-drplant-blue/10 p-2 rounded-lg mr-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-drplant-blue"
          >
            <path d="M10 21v-7.5a2.5 2.5 0 0 1 5 0V21" />
            <path d="M4 16.5a2.5 2.5 0 0 1 5 0V21" />
            <path d="M19.5 8.5a2.5 2.5 0 0 0-5 0v7" />
            <path d="M4 8.5a2.5 2.5 0 0 1 5 0v2.5" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-drplant-blue">PyTorch Plant Disease Model</h3>
          <p className="text-sm text-gray-500">Last updated: {modelInfo.lastUpdated}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm text-gray-500 mb-1">Model Architecture</h4>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600">{modelInfo.framework}</Badge>
            <Badge className="bg-gray-700">{modelInfo.baseModel}</Badge>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm text-gray-500 mb-1">Dataset</h4>
          <p className="text-sm">
            <span className="font-medium">{modelInfo.dataset}</span> - {modelInfo.datasetSize} across {modelInfo.classes} classes
          </p>
        </div>
        
        <div>
          <h4 className="text-sm text-gray-500 mb-1">Data Augmentation Techniques</h4>
          <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-1">
            {modelInfo.dataAugmentation.map((technique, index) => (
              <li key={index} className="flex items-start">
                <span className="text-xs bg-green-100 text-green-800 rounded-full w-4 h-4 inline-flex items-center justify-center mr-1 mt-0.5">✓</span>
                {technique}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm text-gray-500 mb-1">Performance</h4>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-gray-500">Accuracy</span>
              <p className="font-medium">{modelInfo.accuracy}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Training Time</span>
              <p className="font-medium">{modelInfo.trainTime}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-2 text-xs text-gray-500 italic">
          This model runs in the cloud with automatic scaling for high-volume processing.
        </div>
      </div>
    </Card>
  );
};

export default ModelInfoPanel;
