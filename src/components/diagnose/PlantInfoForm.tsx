
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { usePlantInfo } from '@/context/PlantInfoContext';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Form schema for plant information
const plantInfoSchema = z.object({
  isIndoor: z.boolean().default(false),
  inSunlight: z.boolean().default(false),
  wateringFrequency: z.string().min(1, { message: "Inserisci quante volte innaffi la pianta a settimana" }),
});

export type PlantInfoFormValues = z.infer<typeof plantInfoSchema>;

interface PlantInfoFormProps {
  onComplete: (data: PlantInfoFormValues) => void;
}

const PlantInfoForm = ({ onComplete }: PlantInfoFormProps) => {
  const { plantInfo, setPlantInfo } = usePlantInfo();
  
  const form = useForm<PlantInfoFormValues>({
    resolver: zodResolver(plantInfoSchema),
    defaultValues: {
      isIndoor: plantInfo.isIndoor,
      inSunlight: plantInfo.inSunlight,
      wateringFrequency: plantInfo.wateringFrequency || "",
    },
  });
  
  const onSubmitPlantInfo = (data: PlantInfoFormValues) => {
    console.log("Plant information submitted:", data);
    setPlantInfo({...data, infoComplete: true});
    toast.success("Informazioni sulla pianta salvate con successo!");
    onComplete(data);
  };
  
  return (
    <Card className="bg-white p-6 shadow-md rounded-2xl">
      <h3 className="text-xl font-semibold mb-4 text-center">Informazioni sulla Pianta</h3>
      <p className="text-gray-600 mb-6 text-center">
        Prima di procedere con la diagnosi, fornisci alcune informazioni essenziali sulla tua pianta
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitPlantInfo)} className="space-y-6">
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox 
                checked={form.watch("isIndoor")} 
                onCheckedChange={(checked) => form.setValue("isIndoor", !!checked)}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>La pianta si trova all'interno dell'abitazione</FormLabel>
              <FormDescription>
                Indica se la pianta è coltivata in ambiente interno
              </FormDescription>
            </div>
          </FormItem>
          
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox 
                checked={form.watch("inSunlight")} 
                onCheckedChange={(checked) => form.setValue("inSunlight", !!checked)}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>La pianta è esposta alla luce del sole</FormLabel>
              <FormDescription>
                Indica se la pianta riceve luce solare diretta
              </FormDescription>
            </div>
          </FormItem>
          
          <FormField
            control={form.control}
            name="wateringFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequenza di irrigazione (volte a settimana)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Es. 2"
                    type="number"
                    min="0"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Indica quante volte a settimana innaffi la pianta
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-drplant-green hover:bg-drplant-green-dark"
          >
            Salva Informazioni
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default PlantInfoForm;
