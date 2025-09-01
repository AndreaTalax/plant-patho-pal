import React, { useState, useEffect } from 'react';
import { Camera, Upload, FileImage, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DiagnoseWizard from './diagnose/DiagnoseWizard';
import { DiagnosisHistory } from './diagnose/DiagnosisHistory';
import { useAuth } from '@/context/AuthContext';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';

const DiagnoseTab = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { isAuthenticated, userProfile, isMasterAccount } = useAuth();
  const { plantInfo } = usePlantInfo();
  const { toast } = useToast();
  const { t } = useTheme();

  // Reset states when component mounts or user changes
  useEffect(() => {
    setShowWizard(false);
    setShowHistory(false);
  }, [userProfile?.id]);

  const handleStartDiagnosis = () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: t("loginRequired"),
        description: t("pleaseLogin"),
      });
      return;
    }

    setShowWizard(true);
    setShowHistory(false);
  };

  const handleViewHistory = () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive", 
        title: t("loginRequired"),
        description: t("pleaseLogin"),
      });
      return;
    }

    setShowHistory(true);
    setShowWizard(false);
  };

  const handleBackToHome = () => {
    setShowWizard(false);
    setShowHistory(false);
  };

  // Show wizard if active
  if (showWizard) {
    return (
      <DiagnoseWizard />
    );
  }

  // Show history if active  
  if (showHistory) {
    return (
      <DiagnosisHistory />
    );
  }

  // Main diagnosis tab view
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-drplant-blue-dark">
          {t("plantDiagnosis")}
        </h1>
        <p className="text-gray-600">
          {t("diagnosisDescription")}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start New Diagnosis */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartDiagnosis}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-drplant-green/10 rounded-full flex items-center justify-center mx-auto">
              <Camera className="h-8 w-8 text-drplant-green" />
            </div>
            <h3 className="text-lg font-semibold text-drplant-blue-dark">
              {t("startNewDiagnosis")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("takePhotoOrUpload")}
            </p>
            <Button 
              className="w-full bg-drplant-green hover:bg-drplant-green-dark"
              onClick={handleStartDiagnosis}
            >
              {t("startDiagnosis")}
            </Button>
          </CardContent>
        </Card>

        {/* View History */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewHistory}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-drplant-blue/10 rounded-full flex items-center justify-center mx-auto">
              <FileImage className="h-8 w-8 text-drplant-blue" />
            </div>
            <h3 className="text-lg font-semibold text-drplant-blue-dark">
              {t("viewHistory")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("previousDiagnoses")}
            </p>
            <Button 
              variant="outline" 
              className="w-full border-drplant-blue text-drplant-blue hover:bg-drplant-blue hover:text-white"
              onClick={handleViewHistory}
            >
              {t("viewHistory")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-drplant-blue/5 to-drplant-green/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-drplant-blue-dark mb-2">
                {t("tipsForBetterDiagnosis")}
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t("useGoodLighting")}</li>
                <li>• {t("focusOnAffectedAreas")}</li>
                <li>• {t("includeMultipleAngles")}</li>
                <li>• {t("captureCloseUpDetails")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Camera className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-medium text-gray-900">{t("smartAnalysis")}</h4>
          <p className="text-sm text-gray-600">{t("aiPoweredDiagnosis")}</p>
        </div>
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-gray-900">{t("easyUpload")}</h4>
          <p className="text-sm text-gray-600">{t("multipleUploadMethods")}</p>
        </div>
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <FileImage className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-gray-900">{t("detailedResults")}</h4>
          <p className="text-sm text-gray-600">{t("comprehensiveAnalysis")}</p>
        </div>
      </div>
    </div>
  );
};

export default DiagnoseTab;
