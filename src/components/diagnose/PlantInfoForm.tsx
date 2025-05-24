
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

export interface PlantInfoFormValues {
  isIndoor: boolean;
  wateringFrequency: string;
  lightExposure: string;
  symptoms: string;
  useAI: boolean;
  sendToExpert: boolean;
  name?: string;
}

const formSchema = z.object({
  isIndoor: z.boolean(),
  wateringFrequency: z.string().min(1, "La frequenza di irrigazione è obbligatoria"),
  lightExposure: z.string().min(1, "L'esposizione alla luce è obbligatoria"),
  symptoms: z.string().min(10, "Si prega di fornire una descrizione dettagliata dei sintomi (min. 10 caratteri)"),
  name: z.string().optional(),
})

interface PlantInfoFormProps {
  onComplete: (data: PlantInfoFormValues) => void;
}

const PlantInfoForm = ({ onComplete }: PlantInfoFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isIndoor: false,
      wateringFrequency: '',
      lightExposure: '',
      symptoms: '',
      name: '',
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onComplete({
      isIndoor: values.isIndoor,
      wateringFrequency: values.wateringFrequency,
      lightExposure: values.lightExposure,
      symptoms: values.symptoms,
      useAI: true,
      sendToExpert: true,
      name: values.name,
    });
  };

  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Informazioni sulla pianta</h3>
          <p className="text-sm text-gray-500 mb-4">
            Fornisci alcune informazioni sulla tua pianta per ottenere una diagnosi accurata.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome della pianta (opzionale)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Inserisci il nome della pianta se lo conosci" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Se conosci il nome della pianta, aiuterà l'analisi
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isIndoor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di ambiente</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === 'indoor')}
                    defaultValue={field.value ? 'indoor' : 'outdoor'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di ambiente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="indoor">Ambiente interno (chiuso)</SelectItem>
                      <SelectItem value="outdoor">Ambiente esterno (aperto)</SelectItem>
                    </SelectContent>
                  </Select>
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
      </div>
    </Card>
  );
};

export default PlantInfoForm;
