
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Leaf, Eye, Palette } from 'lucide-react';

export interface ImageDisplayProps {
  imageSrc: string;
  isHealthy?: boolean;
  dominantColors?: { hex: string, score: number }[];
  detectedFeatures?: string[];
}

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
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
          isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isHealthy ? 'Sana' : 'Problema rilevato'}
        </div>
      )}
      
      {dominantColors && dominantColors.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-row gap-1 items-center">
          <div className="bg-white p-1 rounded-full">
            <Palette size={12} className="text-gray-700" />
          </div>
          {dominantColors.slice(0, 3).map((color, index) => (
            <div 
              key={index} 
              className="w-4 h-4 rounded-full border border-white" 
              style={{ backgroundColor: color.hex }}
              title={`Color ${index + 1}: ${color.hex}`}
            />
          ))}
        </div>
      )}
      
      {detectedFeatures && detectedFeatures.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[70%]">
          {detectedFeatures.slice(0, 2).map((feature, index) => (
            <Badge key={index} variant="outline" className="bg-white/80 text-xs">
              <Eye className="h-3 w-3 mr-1" /> {feature}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
