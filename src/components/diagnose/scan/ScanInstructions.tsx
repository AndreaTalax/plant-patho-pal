
import React from 'react';
import { CheckCircle, Camera, Sun, Focus } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
* Renders a set of plant care instructions as a card component.
* @example
* renderInstructions()
* <Card className="p-6 mb-8">...</Card>
* @returns {JSX.Element} A card component containing plant care instructions.
* @description
*   - Utilizes Flexbox for responsive layout.
*   - Maps over a predefined set of instructions to generate UI components.
*   - Incorporates icons for visual guidance.
*   - Ensures UI consistency with padding and margin classes.
*/
const ScanInstructions = () => {
  const instructions = [
    {
      icon: Sun,
      title: "Good Lighting",
      description: "Ensure your plant is well-lit, preferably with natural light"
    },
    {
      icon: Focus,
      title: "Clear Focus",
      description: "Keep the camera steady and focus on the affected area"
    },
    {
      icon: Camera,
      title: "Close-up Shot",
      description: "Get close enough to show details but keep the whole leaf/stem visible"
    },
    {
      icon: CheckCircle,
      title: "Multiple Angles",
      description: "Take photos from different angles for better analysis"
    }
  ];

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-center">Tips for Best Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instructions.map((instruction, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
              <instruction.icon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{instruction.title}</h3>
              <p className="text-xs text-gray-600">{instruction.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScanInstructions;
