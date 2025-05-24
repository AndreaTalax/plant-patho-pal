
import React from 'react';
import ScanHeader from './ScanHeader';
import ScanMethods from './ScanMethods';
import ScanFeatures from './ScanFeatures';
import ScanInstructions from './ScanInstructions';

interface ScanLayoutProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

const ScanLayout: React.FC<ScanLayoutProps> = ({ onTakePhoto, onUploadPhoto }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ScanHeader />
      <ScanMethods onTakePhoto={onTakePhoto} onUploadPhoto={onUploadPhoto} />
      <ScanInstructions />
      <ScanFeatures />
    </div>
  );
};

export default ScanLayout;
