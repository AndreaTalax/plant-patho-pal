
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, AlertCircle } from 'lucide-react';

interface SymptomFormProps {
  onSubmit: (symptoms: string) => void;
}

const SymptomForm: React.FC<SymptomFormProps> = ({ onSubmit }) => {
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error('Inserisci una descrizione dei sintomi', {
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(symptoms);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-drplant-blue-dark mb-3">
          Descrivi i sintomi della tua pianta
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Descrivi i sintomi che osservi (es. foglie gialle, macchie, appassimento, ecc.)"
              className="min-h-[120px] w-full"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
          
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
            <p className="flex items-start text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Una descrizione dettagliata aiuterà a fornire una diagnosi più accurata.</span>
            </p>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-drplant-green hover:bg-drplant-green-dark"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                Elaborazione in corso...
              </span>
            ) : (
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4" /> Conferma sintomi
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SymptomForm;
