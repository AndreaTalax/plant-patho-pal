
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface PlantInfoFormValues {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI: boolean;
  sendToExpert: boolean;
}

const formSchema = z.object({
  isIndoor: z.boolean(),
  wateringFrequency: z.string().min(1, "La frequenza di irrigazione è obbligatoria"),
  lightExposure: z.string().min(1, "L'esposizione alla luce è obbligatoria"),
  symptoms: z.string().min(10, "Si prega di fornire una descrizione dettagliata dei sintomi (min. 10 caratteri)"),
  useAI: z.boolean().optional(),
  sendToExpert: z.boolean().optional(),
})

interface PlantInfoFormProps {
  onComplete: (data: PlantInfoFormValues) => void;
}

const PlantInfoForm = ({ onComplete }: PlantInfoFormProps) => {
  const { isAuthenticated } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isIndoor: false,
      wateringFrequency: '',
      lightExposure: '',
      symptoms: '',
      useAI: false,
      sendToExpert: true,
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // If user wants to send to expert but isn't authenticated, show warning
    if (values.sendToExpert && !isAuthenticated) {
      toast("Devi accedere per inviare la richiesta all'esperto di piante", {
        duration: 4000,
      });
    }
    
    // Ensure sendToExpert is not undefined before passing it to onComplete
    onComplete({
      isIndoor: values.isIndoor,
      wateringFrequency: values.wateringFrequency,
      lightExposure: values.lightExposure,
      symptoms: values.symptoms,
      useAI: values.useAI || false,
      sendToExpert: values.sendToExpert || true,
    });
  };

  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Informazioni sulla pianta</h3>
          <p className="text-sm text-gray-500 mb-4">
            Per ottenere una diagnosi più accurata, fornisci alcune informazioni sulla tua pianta.
            Questi dettagli ci aiuteranno a comprendere meglio la sua situazione.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="isIndoor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>La pianta è in ambiente interno (chiuso)</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="wateringFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequenza di irrigazione (volte a settimana) *</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona frequenza" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 volta</SelectItem>
                      <SelectItem value="2">2 volte</SelectItem>
                      <SelectItem value="3">3 volte</SelectItem>
                      <SelectItem value="4">4 o più volte</SelectItem>
                      <SelectItem value="0">Raramente / Mai</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lightExposure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esposizione alla luce *</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona esposizione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full-sun">Sole pieno / luce diretta</SelectItem>
                      <SelectItem value="partial-sun">Parzialmente in ombra</SelectItem>
                      <SelectItem value="shade">Ombra / luce indiretta</SelectItem>
                      <SelectItem value="low-light">Luce scarsa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrivi i sintomi *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrivi i sintomi della pianta (foglie ingiallite, macchie, appassimento, ecc.)"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Fornisci una descrizione dettagliata di tutti i sintomi visibili
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="useAI"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Utilizza Plexi AI per diagnosi preliminare</FormLabel>
                      <FormDescription>
                        <span className="text-blue-600 font-medium">Servizio Premium</span>: Ottieni una diagnosi preliminare immediata con AI (60-75% di accuratezza)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sendToExpert"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Invia richiesta all'esperto di piante</FormLabel>
                      <FormDescription>
                        <span className="text-green-600 font-medium">Consulenza Esperta</span>: Un fitopatologo qualificato esaminerà il tuo caso (accesso richiesto)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full mt-4 bg-drplant-green hover:bg-drplant-green/90"
              >
                Continua
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800">Accuratezza delle diagnosi con Plexi AI:</h4>
          <ul className="mt-2 space-y-2 text-xs text-amber-700">
            <li className="flex items-center">
              <span className="font-medium mr-2">60-75%</span>
              <span>Diagnosi iniziale basata sull'immagine (se la foto è chiara)</span>
            </li>
            <li className="flex items-center">
              <span className="font-medium mr-2">&lt;50%</span>
              <span>Diagnosi accurata se non supportata da test di laboratorio</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default PlantInfoForm;
