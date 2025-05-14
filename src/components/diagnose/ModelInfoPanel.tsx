
import { ModelInfo } from '@/utils/aiDiagnosisUtils';

interface ModelInfoPanelProps {
  modelInfo: ModelInfo;
  onClose: () => void;
}

const ModelInfoPanel = ({ modelInfo, onClose }: ModelInfoPanelProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg">PlantNet + {modelInfo.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-700 mb-1 font-medium">Description</p>
          <p className="text-gray-600 mb-3">
            PlantNet-inspired plant identification system combined with advanced disease detection and the TRY Plant Trait Database.
          </p>
          
          <p className="text-gray-700 mb-1 font-medium">Capabilities</p>
          <ul className="list-disc pl-5 mb-3 text-gray-600">
            {modelInfo.capabilities?.map((capability, index) => (
              <li key={index}>{capability}</li>
            ))}
          </ul>
          
          <p className="text-gray-700 mb-1 font-medium">Dataset</p>
          <p className="text-gray-600 mb-3">{modelInfo.dataset}</p>
          
          <p className="text-gray-700 mb-1 font-medium">Accuracy</p>
          <p className="text-gray-600">{modelInfo.accuracy}</p>
        </div>
        
        <div>
          <p className="text-gray-700 mb-1 font-medium">Architecture</p>
          <p className="text-gray-600 mb-3">
            {modelInfo.architecture.name} <br />
            Parameters: {modelInfo.architecture.parameters}
          </p>
          
          <p className="text-gray-700 mb-1 font-medium">Data Augmentation</p>
          <ul className="list-disc pl-5 mb-3 text-gray-600">
            {modelInfo.dataAugmentation.slice(0, 3).map((technique, index) => (
              <li key={index}>{technique}</li>
            ))}
            {modelInfo.dataAugmentation.length > 3 && <li>+ {modelInfo.dataAugmentation.length - 3} more techniques</li>}
          </ul>
          
          <p className="text-gray-700 mb-1 font-medium">Last Updated</p>
          <p className="text-gray-600">{modelInfo.lastUpdated}</p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-md mt-4">
        <p className="text-blue-800 font-medium text-xs mb-1">
          TRY Plant Trait Database Integration
        </p>
        <p className="text-blue-700 text-xs">
          This system incorporates plant identification techniques from the PlantNet project combined with the TRY Plant Trait Database - 
          an open-source global database of plant traits. This enhances our ability to accurately identify plant species and their 
          specific traits across different environmental conditions.
        </p>
      </div>
    </div>
  );
};

export default ModelInfoPanel;
