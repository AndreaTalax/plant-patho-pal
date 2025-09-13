import React from "react";
import { useNavigate } from "react-router-dom";
import ProfessionalQuoteForm from "@/components/subscription/ProfessionalQuoteForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";

const ProfessionalQuote = () => {
  const navigate = useNavigate();
  const { language } = useTheme();

  const handleProfessionalQuote = (data: any) => {
    console.log('Professional quote submitted:', data);
    toast.success(
      language === 'it' 
        ? 'Preventivo inviato con successo!' 
        : 'Quote sent successfully!'
    );
    // La funzione ProfessionalQuoteForm già gestisce il redirect alla chat
  };

  const handleBack = () => {
    navigate(-1); // Torna alla pagina precedente
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
      
      {/* Back button */}
      <div className="w-full max-w-4xl mb-4">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="flex items-center gap-2 text-drplant-blue-dark hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === 'it' ? 'Indietro' : 'Back'}
        </Button>
      </div>
      
      <ProfessionalQuoteForm 
        onSubmit={handleProfessionalQuote}
        onBack={handleBack}
      />
    </div>
  );
};

export default ProfessionalQuote;