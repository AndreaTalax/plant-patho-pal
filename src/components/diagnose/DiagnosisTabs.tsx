import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, Book, ShoppingBag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { diseaseDetails, diseaseSymptoms } from '@/utils/aiDiagnosisUtils';
import { DiagnosedDisease, AnalysisDetails } from './types';

interface DiagnosisTabsProps {
  disease: DiagnosedDisease;
  analysisDetails: AnalysisDetails | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNavigateToLibrary: (resourceId?: string) => void;
  onNavigateToShop: (productId?: string) => void;
}

/**
 * Render tabs component showing different aspects of a disease diagnosis.
 * @example
 * renderDiagnosisTabs({
 *   disease: { name: 'Powdery Mildew', description: 'A fungal disease affecting plants.' },
 *   analysisDetails: { identifiedFeatures: ['White fungal spots'], alternativeDiagnoses: [] },
 *   activeTab: 'overview',
 *   onTabChange: (newTab) => console.log(newTab),
 *   onNavigateToLibrary: (resource) => console.log(resource),
 *   onNavigateToShop: () => console.log('Navigate to shop')
 * })
 * <Tabs ...>
 * 
 * @param {object} props - DiagnosisTabsProps containing disease details, analysis details, active tab, and navigation functions.
 * @returns {JSX.Element} React component rendering the tabs interface.
 * @description
 *   - Makes use of the 'Tabs' component to display information based on active tab value.
 *   - Provides navigation interactions to 'Learn More' or to view 'Recommended Products'.
 *   - Uses utility function 'hasProduct' to check for product recommendations.
 *   - Displays a warning when the diagnosis confidence is below a certain threshold.
 */
const DiagnosisTabs = ({
  disease,
  analysisDetails,
  activeTab,
  onTabChange,
  onNavigateToLibrary,
  onNavigateToShop
}: DiagnosisTabsProps) => {
  // Safely get products array with multiple fallbacks
  const products = disease?.products || [];
  
  // Safe helper function to check if a product is included
  const hasProduct = (productId: string): boolean => {
    if (!Array.isArray(products)) return false;
    return products.includes(productId);
  };
  
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="treatment">Treatment</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="h-full">
        <h3 className="text-xl font-bold text-drplant-blue mb-2">{disease?.name || 'Unknown'}</h3>
        <p className="text-gray-700 mb-4">{disease?.description || 'No description available'}</p>
        
        <h4 className="font-semibold text-gray-900 mb-2">Causes:</h4>
        <p className="text-gray-700 mb-4">{disease?.causes || 'Unknown causes'}</p>
        
        {analysisDetails && analysisDetails.identifiedFeatures && (
          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-drplant-blue mb-2">Identified Symptoms:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              {analysisDetails.identifiedFeatures.map((feature: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm" onClick={() => onTabChange('details')}>
            View Details
          </Button>
          <Button 
            size="sm"
            className="bg-drplant-green hover:bg-drplant-green-dark"
            onClick={() => onNavigateToLibrary(disease?.resources?.[0])}
          >
            <Book className="mr-2 h-4 w-4" /> Learn More
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="details">
        <h3 className="text-xl font-bold text-drplant-blue mb-4">Disease Details</h3>
        
        {disease?.id && disease.id in diseaseDetails && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Scientific Name:</h4>
              <p className="text-gray-700 italic">
                {diseaseDetails[disease.id as keyof typeof diseaseDetails].scientificName}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Common Host Plants:</h4>
              <div className="flex flex-wrap gap-2">
                {diseaseDetails[disease.id as keyof typeof diseaseDetails].hostPlants.map((plant, index) => (
                  <Badge key={index} variant="outline" className="bg-gray-100">
                    {plant}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Environmental Conditions:</h4>
              <p className="text-gray-700">
                {diseaseDetails[disease.id as keyof typeof diseaseDetails].environmentalConditions}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How It Spreads:</h4>
              <p className="text-gray-700">
                {diseaseDetails[disease.id as keyof typeof diseaseDetails].spreadMechanism}
              </p>
            </div>
            
            {analysisDetails && analysisDetails.alternativeDiagnoses && analysisDetails.alternativeDiagnoses.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Alternative Diagnoses:</h4>
                <ul className="space-y-2">
                  {analysisDetails.alternativeDiagnoses.map((alt: any, index: number) => (
                    <li key={index} className="text-gray-700">
                      {alt.disease} 
                      <span className="text-gray-500 ml-2">
                        ({Math.round(alt.probability * 100)}% confidence)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisDetails && analysisDetails.recommendedAdditionalTests && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-semibold text-amber-700 mb-1">Recommended Additional Tests:</h4>
                <ul className="space-y-1 text-sm text-amber-800">
                  {analysisDetails.recommendedAdditionalTests.map((test: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <Button variant="outline" size="sm" onClick={() => onTabChange('overview')}>
            Back to Overview
          </Button>
          <Button 
            size="sm"
            className="bg-drplant-blue hover:bg-drplant-blue-dark"
            onClick={() => onTabChange('treatment')}
          >
            View Treatment
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="treatment">
        <h3 className="text-xl font-bold text-drplant-blue mb-4">Treatment Plan</h3>
        <ul className="space-y-3">
          {(disease?.treatments || []).map((treatment, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{treatment}</span>
            </li>
          ))}
        </ul>
        
        {disease.id in diseaseDetails && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-2">Prevention Tips:</h4>
            <ul className="space-y-2">
              {diseaseDetails[disease.id as keyof typeof diseaseDetails].preventionTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">✓</span> 
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {disease.confidence < 0.85 && (
          <div className="flex items-start gap-2 mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              This diagnosis has medium confidence. Consider consulting with a plant expert for confirmation.
            </p>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <Button variant="outline" size="sm" onClick={() => onTabChange('details')}>
            Back to Details
          </Button>
          <Button 
            size="sm"
            className="bg-drplant-blue hover:bg-drplant-blue-dark"
            onClick={() => onNavigateToShop()}
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Recommended Products
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="products">
        <h3 className="text-xl font-bold text-drplant-blue mb-4">Recommended Products</h3>
        
        <div className="space-y-4">
          {hasProduct('1') && (
            <div className="border rounded-lg p-3 flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1585687433492-9c648106f131?q=80&w=100&h=100&auto=format&fit=crop" 
                  alt="Organic Neem Oil" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Organic Neem Oil</h4>
                <p className="text-sm text-gray-500 mb-1">Natural fungicide for powdery mildew</p>
                <Button 
                  size="sm" 
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  onClick={() => onNavigateToShop('1')}
                >
                  <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                </Button>
              </div>
            </div>
          )}
          
          {hasProduct('2') && (
            <div className="border rounded-lg p-3 flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1625246333195-78d73c0c15b1?q=80&w=100&h=100&auto=format&fit=crop" 
                  alt="Plant Vitality Boost" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Plant Vitality Boost</h4>
                <p className="text-sm text-gray-500 mb-1">Enhances plant immunity and recovery</p>
                <Button 
                  size="sm" 
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  onClick={() => onNavigateToShop('2')}
                >
                  <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                </Button>
              </div>
            </div>
          )}
          
          {hasProduct('3') && (
            <div className="border rounded-lg p-3 flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1635348424978-142afa11e458?q=80&w=100&h=100&auto=format&fit=crop" 
                  alt="Copper Fungicide" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Copper Fungicide</h4>
                <p className="text-sm text-gray-500 mb-1">Effective against leaf spots</p>
                <Button 
                  size="sm" 
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  onClick={() => onNavigateToShop('3')}
                >
                  <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                </Button>
              </div>
            </div>
          )}
          
          {hasProduct('4') && (
            <div className="border rounded-lg p-3 flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=100&h=100&auto=format&fit=crop" 
                  alt="Insecticidal Soap" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Insecticidal Soap</h4>
                <p className="text-sm text-gray-500 mb-1">Controls aphids and mites</p>
                <Button 
                  size="sm" 
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  onClick={() => onNavigateToShop('4')}
                >
                  <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                </Button>
              </div>
            </div>
          )}
          
          {hasProduct('5') && (
            <div className="border rounded-lg p-3 flex gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1603912699214-92627f304eb6?q=80&w=100&h=100&auto=format&fit=crop" 
                  alt="Soil pH Tester Kit" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Soil pH Tester Kit</h4>
                <p className="text-sm text-gray-500 mb-1">Essential for diagnosing root issues</p>
                <Button 
                  size="sm" 
                  className="bg-drplant-green hover:bg-drplant-green-dark"
                  onClick={() => onNavigateToShop('5')}
                >
                  <ShoppingBag className="mr-1 h-3 w-3" /> View in Shop
                </Button>
              </div>
            </div>
          )}
          
          {products.length === 0 && (
            <p className="text-gray-500">No specific products recommended for this condition.</p>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          <Button variant="outline" size="sm" onClick={() => onTabChange('treatment')}>
            Back to Treatment
          </Button>
          <Button 
            size="sm"
            className="bg-drplant-blue hover:bg-drplant-blue-dark"
            onClick={() => onNavigateToShop()}
          >
            Browse All Products
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DiagnosisTabs;
