
import React from 'react';
import { usePlantDiagnosis } from '@/hooks/usePlantDiagnosis';
import DiagnoseWizard from '@/components/diagnose/DiagnoseWizard';
import { DiagnosisResults } from '@/components/diagnose/result/DiagnosisResults';
import { toast } from 'sonner';

const DiagnoseTab = () => {
  const {
    uploadedImage,
    diagnosisResult,
    diagnosedDisease,
    analysisDetails,
    isAnalyzing,
    analysisProgress,
    resetDiagnosis,
    captureImage,
    handleImageUpload,
    analyzeUploadedImage,
    saveDiagnosis,
    isSaving
  } = usePlantDiagnosis();

  const handleNavigateToShop = (productId: string, productName: string) => {
    // Store product info in localStorage per accesso dal tab Shop
    localStorage.setItem('selectedProduct', JSON.stringify({
      id: productId,
      name: productName,
      fromDiagnosis: true
    }));
    
    // Cambia al tab Shop
    const shopTab = document.querySelector('button[data-tab="shop"]') as HTMLButtonElement;
    if (shopTab) {
      shopTab.click();
    }
    
    toast.success(`Navigando al prodotto: ${productName}`);
  };

  // Create results object from diagnosis data
  const results = diagnosisResult || diagnosedDisease ? {
    plantIdentification: diagnosisResult ? [{
      plantName: diagnosisResult.split('Pianta identificata: ')[1]?.split(' •')[0] || 'Pianta sconosciuta',
      scientificName: '',
      confidence: 65,
      habitat: 'Identificato tramite AI',
      careInstructions: ['Informazioni da analisi AI'],
      provider: 'ai' as any
    }] : [],
    consensus: {
      mostLikelyPlant: diagnosisResult ? {
        plantName: diagnosisResult.split('Pianta identificata: ')[1]?.split(' •')[0] || 'Pianta sconosciuta',
        scientificName: '',
        confidence: 65
      } : null,
      mostLikelyDisease: diagnosedDisease ? {
        disease: diagnosedDisease.name,
        confidence: diagnosedDisease.confidence,
        symptoms: diagnosedDisease.symptoms,
        treatments: diagnosedDisease.treatments
      } : null,
      agreementScore: 0.7,
      bestProvider: 'AI Analysis',
      overallConfidence: 65,
      finalConfidence: 65,
      providersUsed: ['AI Analysis']
    },
    diseaseDetection: diagnosedDisease ? [{
      disease: diagnosedDisease.name,
      confidence: diagnosedDisease.confidence,
      symptoms: diagnosedDisease.symptoms,
      treatments: diagnosedDisease.treatments,
      severity: diagnosedDisease.confidence > 60 ? 'high' : diagnosedDisease.confidence > 40 ? 'medium' : 'low',
      provider: 'ai',
      additionalInfo: {
        cause: diagnosedDisease.causes || ''
      }
    }] : [],
    isFallback: false
  } : null;

  return (
    <div className="space-y-6">
      {/* Wizard per guidare l'utente attraverso il processo */}
      <DiagnoseWizard />

      {/* Risultati diagnosi */}
      {results && (
        <DiagnosisResults 
          results={results} 
          isFallback={false}
          onNavigateToShop={handleNavigateToShop}
        />
      )}
    </div>
  );
};

export default DiagnoseTab;
