
import React from 'react';
import ScanHeader from './ScanHeader';
import ScanMethods from './ScanMethods';
import ScanFeatures from './ScanFeatures';
import ScanInstructions from './ScanInstructions';
import { Sparkles } from 'lucide-react';

interface ScanLayoutProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

const ScanLayout: React.FC<ScanLayoutProps> = ({ onTakePhoto, onUploadPhoto }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-drplant-blue/5 via-transparent to-drplant-green/5 pointer-events-none" />
      
      <div className="relative">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent mb-4">
            <Sparkles className="h-6 w-6 text-drplant-green animate-pulse" />
            <span className="text-lg font-medium">Diagnosi AI Avanzata</span>
          </div>
          <ScanHeader />
        </div>

        {/* Main content with improved layout */}
        <div className="space-y-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-drplant-green/20">
            <ScanMethods onTakePhoto={onTakePhoto} onUploadPhoto={onUploadPhoto} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-drplant-blue/20">
              <ScanInstructions />
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-drplant-green/20">
              <ScanFeatures />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanLayout;
