import React from 'react';

interface CameraGridProps {
  visible: boolean;
}

const CameraGrid: React.FC<CameraGridProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Rule of thirds grid */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Vertical lines */}
        <line
          x1="33.33"
          y1="0"
          x2="33.33"
          y2="100"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.2"
        />
        <line
          x1="66.67"
          y1="0"
          x2="66.67"
          y2="100"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.2"
        />
        {/* Horizontal lines */}
        <line
          x1="0"
          y1="33.33"
          x2="100"
          y2="33.33"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.2"
        />
        <line
          x1="0"
          y1="66.67"
          x2="100"
          y2="66.67"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.2"
        />
      </svg>
    </div>
  );
};

export default CameraGrid;