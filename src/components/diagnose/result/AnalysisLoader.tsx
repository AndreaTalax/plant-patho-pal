
import { Loader2 } from 'lucide-react';

interface AnalysisLoaderProps {
  analysisProgress: number;
}

/**
 * Displays a loading spinner and progress bar indicating analysis progress of a plant.
 * @example
 * AnalysisLoader({ analysisProgress: 50 })
 * // Renders a spinning loader with a progress bar 50% filled and respective text messages.
 * @param {number} analysisProgress - Current progress of the analysis represented as a number between 0 and 100.
 * @returns {JSX.Element} A JSX element that includes a loader icon, progress bar, and status messages.
 * @description
 *   - Utilizes Tailwind CSS for styling flexbox layout, colors, and animations.
 *   - The loader icon is animated to spin.
 *   - Progress bar's value is controlled by the `analysisProgress` parameter.
 *   - Contains user-friendly text messaging indicating the progress and purpose of the analysis.
 */
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
