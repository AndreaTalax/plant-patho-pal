import React from 'react';

interface ModelInfo {
  name: string;
  accuracy: string;
  dataset: string;
  inputSize: string;
  classes: number;
  lastUpdated: string;
  framework: string;
  architecture: {
    name: string;
    modified: boolean;
    layers: number;
    parameters: string;
  };
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  baseModel: string;
  datasetSize: string;
  dataAugmentation: string[];
  trainTime: string;
}

interface ModelInfoPanelProps {
  modelInfo: ModelInfo;
  onClose: () => void;
}

const ModelInfoPanel = ({ modelInfo, onClose }: ModelInfoPanelProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 relative text-sm">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <h3 className="text-lg font-bold mb-4 text-drplant-blue flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        PictureThis AI Diagnosis Model
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-gray-700">Base Architecture</h4>
          <p>{modelInfo.baseModel}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Accuracy</h4>
          <p>{modelInfo.accuracy}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Classes</h4>
          <p>{modelInfo.classes} plant diseases</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Last Updated</h4>
          <p>{modelInfo.lastUpdated}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Dataset</h4>
          <p>{modelInfo.datasetSize}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Framework</h4>
          <p>{modelInfo.framework}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-semibold text-gray-700 mb-1">Performance Metrics</h4>
        <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-gray-500">Precision</div>
            <div className="font-medium">{modelInfo.metrics.precision.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Recall</div>
            <div className="font-medium">{modelInfo.metrics.recall.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">F1 Score</div>
            <div className="font-medium">{modelInfo.metrics.f1Score.toFixed(3)}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-semibold text-gray-700 mb-1">Data Augmentation</h4>
        <div className="flex flex-wrap gap-1">
          {modelInfo.dataAugmentation.map((technique, index) => (
            <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
              {technique}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>PictureThis AI integration provides enhanced plant identification and disease diagnosis capabilities.</p>
      </div>
    </div>
  );
};

export default ModelInfoPanel;
