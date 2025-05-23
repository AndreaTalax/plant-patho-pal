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
  wateringFrequency: z.string().min(1, "Watering frequency is required"),
  lightExposure: z.string().min(1, "Light exposure is required"),
  symptoms: z.string().min(10, "Please provide a detailed description of the symptoms (min. 10 characters)"),
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
      toast("You need to log in to send the request to the plant expert", {
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Plant Information</h3>
          <p className="text-sm text-gray-500 mb-4">
            To get a more accurate diagnosis, please provide some information about your plant.
            These details will help us better understand its situation.
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
                    <FormLabel>Is the plant indoors (closed environment)</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="wateringFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Watering frequency (times per week) *</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 time</SelectItem>
                      <SelectItem value="2">2 times</SelectItem>
                      <SelectItem value="3">3 times</SelectItem>
                      <SelectItem value="4">4 or more times</SelectItem>
                      <SelectItem value="0">Rarely / Never</SelectItem>
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
                  <FormLabel>Light exposure *</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exposure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full-sun">Full sun / direct sunlight</SelectItem>
                      <SelectItem value="partial-sun">Partially shaded</SelectItem>
                      <SelectItem value="shade">Shade / indirect light</SelectItem>
                      <SelectItem value="low-light">Low light</SelectItem>
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
                  <FormLabel>Describe the symptoms *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the symptoms of the plant (yellowing leaves, spots, wilting, etc.)"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of all visible symptoms
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
                      <FormLabel>Use artificial intelligence for preliminary diagnosis</FormLabel>
                      <FormDescription>
                        <span className="text-blue-600 font-medium">Premium Service</span>: Get an immediate preliminary AI diagnosis (60-75% accuracy)
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
                      <FormLabel>Send request to plant expert</FormLabel>
                      <FormDescription>
                        <span className="text-green-600 font-medium">Expert Consultation</span>: A qualified plant pathologist will examine your case (login required)
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
                Continue
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800">Accuracy of AI diagnoses:</h4>
          <ul className="mt-2 space-y-2 text-xs text-amber-700">
            <li className="flex items-center">
              <span className="font-medium mr-2">60-75%</span>
              <span>Initial AI diagnosis based on image (if the photo is clear)</span>
            </li>
            <li className="flex items-center">
              <span className="font-medium mr-2">&lt;50%</span>
              <span>Accurate diagnosis if not supported by laboratory tests</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default PlantInfoForm;
