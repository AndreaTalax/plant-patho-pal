import React, { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { UploadButton } from "@/utils/uploadthing";
import { generateAnalysis } from '@/lib/analysis';
import { Wizard } from '@/components/diagnose/Wizard';
import { DiagnosisResults } from '@/components/diagnose/result/DiagnosisResults';
import { type CombinedAnalysisResult } from '@/types/analysis';

const DiagnoseTab = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [results, setResults] = useState<CombinedAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const onClientGenerate = useCallback(async () => {
    if (!imageUrl) {
      toast.error('Please upload an image first.');
      return;
    }

    setLoading(true);
    setIsFallback(false);
    try {
      const analysis = await generateAnalysis(imageUrl);
      setResults(analysis);
      setIsFallback(analysis.isFallback);
    } catch (error: any) {
      console.error("Error during analysis:", error);
      toast.error(`Failed to generate analysis: ${error.message || error}`);
      setResults(null);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, [imageUrl]);

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

  return (
    <div className="space-y-6">
      {/* Wizard per guidare l'utente attraverso il processo */}
      <Wizard
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        onGenerate={onClientGenerate}
        loading={loading}
      />

      {/* Upload immagine */}
      {!imageUrl && (
        <div className="flex justify-center">
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res && res.length > 0) {
                setImageUrl(res[0].url);
                toast.success("Image uploaded successfully!");
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
          />
        </div>
      )}

      {/* Risultati diagnosi */}
      {results && (
        <DiagnosisResults 
          results={results} 
          isFallback={isFallback}
          onNavigateToShop={handleNavigateToShop}
        />
      )}
    </div>
  );
};

export default DiagnoseTab;
