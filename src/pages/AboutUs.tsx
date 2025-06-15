
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Users, Info } from 'lucide-react';

const AboutUs = () => {
  const { t } = useTheme();
  
  return (
    <div className="bg-gradient-to-b from-sky-50 to-white min-h-screen">
      <Header />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-drplant-blue text-center mb-8">
            {t("aboutUs")}
          </h1>
          
          <div className="space-y-10">
            <section>
              <div className="flex items-center mb-4">
                <Info className="w-6 h-6 text-drplant-green mr-2" />
                <h2 className="text-2xl font-semibold">{t("ourMission")}</h2>
              </div>
              <Separator className="mb-4" />
              <p className="text-gray-600">
                {t("missionDescription")}
              </p>
              <div className="mt-6">
                <img 
                  src="/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png" 
                  alt="DR PLANT Mission" 
                  className="mx-auto rounded-lg shadow-md"
                  style={{ maxWidth: '300px' }}
                />
              </div>
            </section>
            
            <section>
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-drplant-green mr-2" />
                <h2 className="text-2xl font-semibold">{t("ourTeam")}</h2>
              </div>
              <Separator className="mb-4" />
              <p className="text-gray-600 mb-6">
                {t("teamDescription")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-drplant-green/10 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3"
                          alt="Marco Nigro"
                          className="rounded-full object-cover w-20 h-20"
                        />
                      </div>
                      <h3 className="font-medium text-lg">Marco Nigro</h3>
                      <p className="text-gray-500 text-sm">Agrotecnico Fitopatologico</p>
                      <p className="text-xs text-gray-400 mt-2">agrotecnicomarconigro@gmail.com</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
            
            <section>
              <div className="flex items-center mb-4">
                <Globe className="w-6 h-6 text-drplant-green mr-2" />
                <h2 className="text-2xl font-semibold">{t("ourImpact")}</h2>
              </div>
              <Separator className="mb-4" />
              <p className="text-gray-600 mb-6">
                {t("impactDescription")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-drplant-blue/10 p-2 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-drplant-blue"></div>
                  </div>
                  <p className="text-gray-600 text-sm">{t("impactPoint1")}</p>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="bg-drplant-blue/10 p-2 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-drplant-blue"></div>
                  </div>
                  <p className="text-gray-600 text-sm">{t("impactPoint2")}</p>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="bg-drplant-blue/10 p-2 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-drplant-blue"></div>
                  </div>
                  <p className="text-gray-600 text-sm">{t("impactPoint3")}</p>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="bg-drplant-blue/10 p-2 rounded-full">
                    <div className="h-2 w-2 rounded-full bg-drplant-blue"></div>
                  </div>
                  <p className="text-gray-600 text-sm">{t("impactPoint4")}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

