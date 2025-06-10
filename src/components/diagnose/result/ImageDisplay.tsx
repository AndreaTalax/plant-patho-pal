
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Leaf, Eye, Palette, AlertCircle, CheckCircle } from 'lucide-react';

export interface ImageDisplayProps {
  imageSrc: string;
  isHealthy?: boolean;
  dominantColors?: { hex: string, score: number }[];
  detectedFeatures?: string[];
}

/**
 * Displays an analyzed plant image with overlays showing health status, dominant colors, and detected features.
 * @example
 * displayImage({
 *   imageSrc: '/path/to/image.jpg',
 *   isHealthy: true,
 *   dominantColors: [{ hex: '#FFFFFF' }, { hex: '#000000' }],
 *   detectedFeatures: ['feature1', 'feature2']
 * })
 * - Renders a visual summary of the plant's analysis.
 * @param {Object} {imageSrc, isHealthy, dominantColors, detectedFeatures} - Object containing properties for image display.
 * @param {string} imageSrc - The source URL of the image to display.
 * @param {boolean} [isHealthy] - Boolean flag indicating if the plant is healthy.
 * @param {Object[]} [dominantColors] - Array of color objects providing dominant colors in the image.
 * @param {string} dominantColors[].hex - Hexadecimal color code.
 * @param {string[]} [detectedFeatures] - Array of strings indicating features detected in the image.
 * @returns {JSX.Element} A JSX element representing the plant analysis overlay.
 * @description
 *   - Determines position of overlays based on available data.
 *   - Limits displayed dominant colors and features for succinctness.
 *   - Renders health status using conditional styling classes.
 */
const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageSrc, 
  isHealthy,
  dominantColors,
  detectedFeatures
}) => {
  return (
    <div className="relative mb-4">
      <img 
        src={imageSrc} 
        alt="Analyzed plant" 
        className="w-full rounded-lg border shadow-sm"
      />
      
      {isHealthy !== undefined && (
        <div className={`absolute top-2 right-2 px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 ${
          isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isHealthy ? 
            <><CheckCircle size={12} /> Sana</> : 
            <><AlertCircle size={12} /> Problema rilevato</>
          }
        </div>
      )}
      
      {dominantColors && dominantColors.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-row gap-1 items-center">
          <div className="bg-white p-1 rounded-full shadow-sm">
            <Palette size={12} className="text-gray-700" />
          </div>
          {dominantColors.slice(0, 3).map((color, index) => (
            <div 
              key={index} 
              className="w-5 h-5 rounded-full border border-white shadow-sm" 
              style={{ backgroundColor: color.hex }}
              title={`Color ${index + 1}: ${color.hex}`}
            />
          ))}
        </div>
      )}
      
      {detectedFeatures && detectedFeatures.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[70%]">
          {detectedFeatures.slice(0, 2).map((feature, index) => (
            <Badge key={index} variant="outline" className="bg-white/80 text-xs flex items-center gap-1 shadow-sm">
              <Eye className="h-3 w-3" /> {feature}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
