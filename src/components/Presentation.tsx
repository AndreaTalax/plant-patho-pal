
import { Camera, MessageCircle, ShoppingBag, Leaf, User, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Generates the main presentation section for a plant care application frontend.
 * @example
 * Presentation()
 * // A JSX UI component featuring various plant care services.
 * @returns {JSX.Element} A JSX element containing the presentation structure for the plant care application.
 * @description
 *   - Constructs a UI with sections for various plant care features, each including icons, titles, descriptions, details, and gradients.
 *   - Includes a hero section with a welcome message and a call-to-action (CTA) section encouraging engagement with the application.
 *   - Uses a grid layout to organize feature cards, each with hover effects and visual transitions.
 */
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
      ],
      gradient: "from-drplant-blue to-drplant-blue-light"
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
      ],
      gradient: "from-drplant-green to-drplant-green/80"
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
      ],
      gradient: "from-drplant-blue-light to-drplant-blue"
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
      ],
      gradient: "from-drplant-green/80 to-drplant-green-dark"
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
      ],
      gradient: "from-drplant-blue to-drplant-green"
    }
  ];

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-drplant-blue/10 via-transparent to-drplant-green/10 rounded-3xl -z-10" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent mb-4">
            <Sparkles className="h-8 w-8 text-drplant-green animate-pulse" />
            <span className="text-lg font-medium">Benvenuto su</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent mb-8">
            DR PLANT
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            La tua soluzione completa per la cura delle piante che combina 
            <span className="text-drplant-blue font-semibold"> diagnosi AI</span>, 
            <span className="text-drplant-green font-semibold"> supporto esperto</span> e 
            <span className="text-drplant-blue font-semibold"> prodotti di qualità</span> 
            per piante più sane.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-[1.02] overflow-hidden relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            <CardHeader className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-drplant-blue transition-colors">
                  {feature.title}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
              <ul className="space-y-3">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-r from-drplant-blue to-drplant-green rounded-full flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-drplant-blue/10 to-drplant-green/10 rounded-3xl p-12 border border-drplant-green/20">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Inizia il tuo viaggio con DR PLANT
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Unisciti a migliaia di appassionati di piante che stanno già trasformando i loro giardini con la nostra tecnologia avanzata.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-drplant-green/20 flex-1 max-w-sm">
            <Camera className="h-12 w-12 text-drplant-blue mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">Diagnosi Istantanea</h3>
            <p className="text-sm text-gray-600">Scatta una foto e ottieni risultati in secondi</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-drplant-green/20 flex-1 max-w-sm">
            <MessageCircle className="h-12 w-12 text-drplant-green mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">Consulenza Esperta</h3>
            <p className="text-sm text-gray-600">Supporto 24/7 da fitopatologi qualificati</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentation;
