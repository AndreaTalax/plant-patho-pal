
import React from 'react';
import { Leaf, Sparkles } from 'lucide-react';

const ScanHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="bg-green-100 p-3 rounded-full">
          <Leaf className="h-8 w-8 text-green-600" />
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
