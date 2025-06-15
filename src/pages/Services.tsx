import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Camera, MessageCircle, ShoppingBag, Leaf, User } from 'lucide-react';

/**
 * Renders a services page with various cards and actions representing different service offerings.
 * @example
 * renderServicesPage()
 * <div>...</div>
 * @param {Object} useTheme - A hook that provides theme-based functionalities.
 * @param {Function} useNavigate - A hook used for navigation within the application.
 * @returns {JSX.Element} The rendered component representing the services page.
 * @description
 *   - Utilizes translation hook 't' to display service titles and descriptions.
 *   - Each service card provides an action when clicked, navigating the user to the homepage.
 *   - Supports both standard and premium service offerings with respective layouts.
 *   - Offers contact functionality for premium services through a dedicated button.
 */
const Services = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  
  const services = [
    {
      icon: Camera,
      title: "plantDiagnosis",
      description: "plantDiagnosisDesc"
    },
    {
      icon: MessageCircle,
      title: "expertConsultation",
      description: "expertConsultationDesc"
    },
    {
      icon: ShoppingBag,
      title: "plantCareShop",
      description: "plantCareShopDesc"
    },
    {
      icon: Leaf,
      title: "plantCareLibrary",
      description: "plantCareLibraryDesc"
    },
  ];

  return (
    <div className="bg-gradient-to-b from-sky-50 to-white min-h-screen">
      <Header />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-drplant-blue text-center mb-4">
            {t("ourServices")}
          </h1>
          
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
            {t("servicesIntro")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-drplant-blue/10 rounded-lg">
                      <service.icon className="w-6 h-6 text-drplant-blue" />
                    </div>
                    <CardTitle className="text-xl">{t(service.title)}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">{t(service.description)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 bg-drplant-blue/5 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-drplant-blue text-center mb-4">
              {t("premiumServices")}
            </h2>
            
            <p className="text-gray-600 text-center mb-8">
              {t("premiumServicesDesc")}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-drplant-blue mb-2">{t("onSiteConsultation")}</h3>
                <p className="text-sm text-gray-500">{t("onSiteConsultationDesc")}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-drplant-blue mb-2">{t("laboratoryAnalysis")}</h3>
                <p className="text-sm text-gray-500">{t("laboratoryAnalysisDesc")}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-drplant-blue mb-2">{t("customTreatmentPlans")}</h3>
                <p className="text-sm text-gray-500">{t("customTreatmentPlansDesc")}</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                className="border-drplant-blue text-drplant-blue hover:bg-drplant-blue hover:text-white"
                onClick={() => navigate('/contact')}
              >
                {t("contactForPremium")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
