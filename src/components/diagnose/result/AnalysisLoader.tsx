
import { Loader2 } from 'lucide-react';

interface AnalysisLoaderProps {
  analysisProgress: number;
}

const AnalysisLoader = ({ analysisProgress }: AnalysisLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-4 h-full">
      <Loader2 className="h-8 w-8 text-drplant-blue animate-spin mb-4" />
      <p className="text-drplant-blue font-medium mb-2">Analyzing your plant...</p>
      <div className="w-full max-w-xs">
        <progress value={analysisProgress} max="100" className="w-full h-2" />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Multiple AI services are analyzing your plant
      </p>
    </div>
  );
};

export default AnalysisLoader;
