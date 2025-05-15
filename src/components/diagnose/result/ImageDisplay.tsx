
import React from 'react';

export interface ImageDisplayProps {
  imageSrc: string;
  isHealthy?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageSrc, isHealthy }) => {
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
          {isHealthy ? 'Healthy' : 'Issue Detected'}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
