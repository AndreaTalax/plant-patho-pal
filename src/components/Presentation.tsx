
import { Camera, MessageCircle, ShoppingBag, Leaf, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Presentation = () => {
  const features = [
    {
      icon: Camera,
      title: "Plant Disease Diagnosis",
      description: "Advanced AI-powered system that analyzes plant photos to identify diseases and provide treatment recommendations with high accuracy.",
      details: [
        "Instant disease detection",
        "Detailed analysis reports",
        "Treatment recommendations",
        "Historical diagnosis tracking"
      ]
    },
    {
      icon: MessageCircle,
      title: "Expert Chat Support",
      description: "Connect with plant experts in real-time for personalized advice and care recommendations.",
      details: [
        "24/7 expert availability",
        "Personalized plant care advice",
        "Quick response times",
        "Chat history for reference"
      ]
    },
    {
      icon: ShoppingBag,
      title: "Plant Care Shop",
      description: "Curated selection of high-quality plant care products, treatments, and gardening essentials.",
      details: [
        "Quality-tested products",
        "Treatment solutions",
        "Garden essentials",
        "Secure checkout"
      ]
    },
    {
      icon: Leaf,
      title: "Plant Care Library",
      description: "Comprehensive resource center with guides, tips, and best practices for plant care.",
      details: [
        "Detailed care guides",
        "Seasonal tips",
        "Disease prevention",
        "Plant species database"
      ]
    },
    {
      icon: User,
      title: "Personal Dashboard",
      description: "Track your plant care journey with a personalized dashboard showing diagnosis history and saved resources.",
      details: [
        "Diagnosis history",
        "Saved plant guides",
        "Order tracking",
        "Profile customization"
      ]
    }
  ];

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-drplant-blue mb-6">
          Welcome to DR PLANT
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your comprehensive plant care solution combining AI-powered diagnosis, expert support, and quality products for healthier plants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-drplant-blue/10 rounded-lg">
                  <feature.icon className="w-6 h-6 text-drplant-blue" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-drplant-blue rounded-full" />
                    {detail}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Presentation;
