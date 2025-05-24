
import React from 'react';
import { Shield, Zap, Users, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ScanFeatures = () => {
  const features = [
    {
      icon: Zap,
      title: "Instant Analysis",
      description: "Get results in seconds with our advanced AI algorithms"
    },
    {
      icon: Shield,
      title: "99% Accuracy",
      description: "Trusted by gardeners worldwide for reliable plant diagnosis"
    },
    {
      icon: Users,
      title: "Expert Network",
      description: "Connect with certified plant pathologists when needed"
    },
    {
      icon: Award,
      title: "Proven Results",
      description: "Over 1M+ plants successfully diagnosed and treated"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-center mb-6">Why Choose Our Scanner?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="p-4 text-center">
            <div className="bg-gray-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <feature.icon className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScanFeatures;
