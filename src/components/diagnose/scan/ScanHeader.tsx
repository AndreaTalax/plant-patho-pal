
import React from 'react';
import { Sparkles } from 'lucide-react';

const ScanHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="bg-green-100 p-3 rounded-full">
          <img 
            src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
            alt="Dr.Plant Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Plant Health Scanner
      </h1>
      <p className="text-lg text-gray-600 mb-4">
        Instantly identify plant diseases and get expert treatment recommendations
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
        <Sparkles className="h-4 w-4" />
        <span>Powered by Advanced AI Technology</span>
      </div>
    </div>
  );
};

export default ScanHeader;
