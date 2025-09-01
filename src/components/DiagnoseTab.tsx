
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePlantInfo } from "@/context/PlantInfoContext";
import DiagnoseWizard from "./diagnose/DiagnoseWizard";
import { DiagnosisHistory } from "./diagnose/DiagnosisHistory";
import { Button } from "@/components/ui/button";
import { History, Scan } from "lucide-react";

const DiagnoseTab = () => {
  const { userProfile } = useAuth();
  const { plantInfo } = usePlantInfo();
  const [activeView, setActiveView] = useState<'wizard' | 'history'>('wizard');

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header con toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ciao {userProfile?.firstName || userProfile?.first_name || 'Utente'}!
        </h1>
        
        <div className="flex gap-2">
          <Button
            variant={activeView === 'wizard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('wizard')}
            className="flex items-center gap-2"
          >
            <Scan className="h-4 w-4" />
            Nuova Diagnosi
          </Button>
          <Button
            variant={activeView === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Cronologia
          </Button>
        </div>
      </div>

      {/* Contenuto principale */}
      {activeView === 'wizard' ? (
        <DiagnoseWizard />
      ) : (
        <DiagnosisHistory />
      )}
    </div>
  );
};

export default DiagnoseTab;
