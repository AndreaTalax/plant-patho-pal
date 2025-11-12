import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, Users, Briefcase, Loader2, CheckCircle, FileText } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PHONE_PREFIXES = [
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
];

interface ProfessionalQuoteFormProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
}

const ProfessionalQuoteForm = ({ onBack, onSubmit }: ProfessionalQuoteFormProps) => {
  const { language } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phonePrefix: '+39',
    phone: '',
    businessType: '',
    plantTypes: [] as string[],
    currentChallenges: '',
    expectedVolume: '',
    preferredFeatures: [] as string[],
    budget: '',
    timeline: '',
    additionalInfo: '',
    privacyAccepted: false
  });

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validazione base
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
      toast.error(language === 'it' ? 'Compilare tutti i campi obbligatori' : 'Please fill all required fields');
      return;
    }

    if (!formData.privacyAccepted) {
      toast.error(language === 'it' ? 'Accetta la privacy policy per continuare' : 'Accept privacy policy to continue');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Crea la richiesta di preventivo professionale
      const { data, error } = await supabase.functions.invoke('create-professional-quote', {
        body: { formData }
      });

      if (error) {
        console.error('Error creating professional quote:', error);
        toast.error(language === 'it' ? 'Errore nella creazione della richiesta' : 'Error creating quote request');
        return;
      }

      toast.success(
        language === 'it' 
          ? '✅ Richiesta inviata! PDF generato e conversazione creata. Ti reindirizziamo alla chat...' 
          : '✅ Request sent! PDF generated and conversation created. Redirecting you to chat...'
      );

      // Salva l'ID della conversazione per aprirla
      localStorage.setItem('openConversationId', data.conversationId);

      // Reindirizza alla chat dopo 2 secondi
      setTimeout(() => {
        const event = new CustomEvent('switchTab', { detail: 'chat' });
        window.dispatchEvent(event);
      }, 2000);

      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(language === 'it' ? 'Errore nell\'invio della richiesta' : 'Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessTypes = [
    { value: 'nursery', label: language === 'it' ? 'Vivaio' : 'Nursery' },
    { value: 'farm', label: language === 'it' ? 'Azienda Agricola' : 'Farm' },
    { value: 'research', label: language === 'it' ? 'Centro di Ricerca' : 'Research Center' },
    { value: 'consulting', label: language === 'it' ? 'Consulenza Agronomica' : 'Agronomic Consulting' },
    { value: 'education', label: language === 'it' ? 'Istituto Formativo' : 'Educational Institute' },
    { value: 'government', label: language === 'it' ? 'Ente Pubblico' : 'Government Entity' },
    { value: 'cooperative', label: language === 'it' ? 'Cooperativa' : 'Cooperative' },
    { value: 'other', label: language === 'it' ? 'Altro' : 'Other' }
  ];

  const plantTypeOptions = [
    { value: 'ornamental', label: language === 'it' ? 'Piante Ornamentali' : 'Ornamental Plants' },
    { value: 'vegetables', label: language === 'it' ? 'Ortaggi' : 'Vegetables' },
    { value: 'fruits', label: language === 'it' ? 'Frutta' : 'Fruits' },
    { value: 'cereals', label: language === 'it' ? 'Cereali' : 'Cereals' },
    { value: 'vines', label: language === 'it' ? 'Vite' : 'Vines' },
    { value: 'olives', label: language === 'it' ? 'Olivo' : 'Olives' },
    { value: 'greenhouse', label: language === 'it' ? 'Piante da Serra' : 'Greenhouse Plants' },
    { value: 'forest', label: language === 'it' ? 'Piante Forestali' : 'Forest Plants' }
  ];

  const featureOptions = [
    { value: 'ai_diagnosis', label: language === 'it' ? 'Diagnosi AI Avanzata' : 'Advanced AI Diagnosis' },
    { value: 'expert_chat', label: language === 'it' ? 'Chat con Esperti' : 'Expert Chat' },
    { value: 'custom_reports', label: language === 'it' ? 'Report Personalizzati' : 'Custom Reports' }
  ];

  const budgets = [
    { value: '10000-25000', label: '€10.000 - €25.000' },
    { value: '25000-50000', label: '€25.000 - €50.000' },
    { value: '50000-100000', label: '€50.000 - €100.000' },
    { value: '100000+', label: '€100.000+' },
    { value: 'custom', label: language === 'it' ? 'Budget personalizzato' : 'Custom budget' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-drplant-blue-dark mb-4 flex items-center justify-center gap-2">
          <FileText className="h-8 w-8" />
          {language === 'it' ? 'Richiesta Preventivo Professionale' : 'Professional Quote Request'}
        </h2>
        <p className="text-gray-600">
          {language === 'it' 
            ? 'Compila il modulo per ricevere un preventivo PDF personalizzato via email e chat'
            : 'Fill out the form to receive a customized PDF quote via email and chat'
          }
        </p>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-drplant-blue-dark">
            <Briefcase className="h-6 w-6" />
            {language === 'it' ? 'Informazioni Aziendali' : 'Company Information'}
          </CardTitle>
          <CardDescription>
            {language === 'it' 
              ? 'Fornisci i dettagli della tua organizzazione per un\'offerta su misura'
              : 'Provide your organization details for a tailored offer'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informazioni Base */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {language === 'it' ? 'Nome Azienda *' : 'Company Name *'}
              </Label>
              <Input
                id="companyName"
                placeholder={language === 'it' ? 'Inserisci il nome della tua azienda' : 'Enter your company name'}
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {language === 'it' ? 'Persona di Contatto *' : 'Contact Person *'}
              </Label>
              <Input
                id="contactPerson"
                placeholder={language === 'it' ? 'Nome e cognome referente' : 'Contact person name'}
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {language === 'it' ? 'Email Aziendale *' : 'Business Email *'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={language === 'it' ? 'email@azienda.com' : 'email@company.com'}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {language === 'it' ? 'Telefono *' : 'Phone *'}
              </Label>
              <div className="flex gap-2">
                <Select value={formData.phonePrefix} onValueChange={(value) => handleInputChange('phonePrefix', value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_PREFIXES.map((prefix) => (
                      <SelectItem key={prefix.code} value={prefix.code}>
                        {prefix.flag} {prefix.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  placeholder="xxx xxx xxxx"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Dettagli Business */}
          <div className="space-y-2">
            <Label htmlFor="businessType">
              {language === 'it' ? 'Tipo di Business *' : 'Business Type *'}
            </Label>
            <Select onValueChange={(value) => handleInputChange('businessType', value)}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'it' ? 'Seleziona il tipo di business...' : 'Select business type...'} />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipi di Piante */}
          <div className="space-y-2">
            <Label>{language === 'it' ? 'Tipi di Piante di Interesse *' : 'Plant Types of Interest *'}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {plantTypeOptions.map((plant) => (
                <div key={plant.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={plant.value}
                    checked={formData.plantTypes.includes(plant.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleInputChange('plantTypes', [...formData.plantTypes, plant.value]);
                      } else {
                        handleInputChange('plantTypes', formData.plantTypes.filter(t => t !== plant.value));
                      }
                    }}
                  />
                  <Label htmlFor={plant.value} className="text-sm">{plant.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sfide e Requisiti */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentChallenges">
                {language === 'it' ? 'Sfide Attuali nella Gestione delle Piante *' : 'Current Plant Management Challenges *'}
              </Label>
              <Textarea
                id="currentChallenges"
                placeholder={language === 'it' 
                  ? 'Descrivi le principali difficoltà che incontri nella diagnosi e cura delle piante...'
                  : 'Describe the main difficulties you encounter in plant diagnosis and care...'
                }
                value={formData.currentChallenges}
                onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedVolume">
                {language === 'it' ? 'Volume di Diagnosi Previsto' : 'Expected Diagnosis Volume'}
              </Label>
              <Select onValueChange={(value) => handleInputChange('expectedVolume', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'it' ? 'Seleziona...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10-50">{language === 'it' ? '10-50 diagnosi/mese' : '10-50 diagnoses/month'}</SelectItem>
                  <SelectItem value="50-200">{language === 'it' ? '50-200 diagnosi/mese' : '50-200 diagnoses/month'}</SelectItem>
                  <SelectItem value="200-500">{language === 'it' ? '200-500 diagnosi/mese' : '200-500 diagnoses/month'}</SelectItem>
                  <SelectItem value="500+">{language === 'it' ? '500+ diagnosi/mese' : '500+ diagnoses/month'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Funzionalità Preferite */}
            <div className="space-y-2">
              <Label>{language === 'it' ? 'Funzionalità Preferite' : 'Preferred Features'}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featureOptions.map((feature) => (
                  <div key={feature.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={feature.value}
                      checked={formData.preferredFeatures.includes(feature.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleInputChange('preferredFeatures', [...formData.preferredFeatures, feature.value]);
                        } else {
                          handleInputChange('preferredFeatures', formData.preferredFeatures.filter(f => f !== feature.value));
                        }
                      }}
                    />
                    <Label htmlFor={feature.value} className="text-sm">{feature.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">
                {language === 'it' ? 'Budget Indicativo' : 'Indicative Budget'}
              </Label>
              <Select onValueChange={(value) => handleInputChange('budget', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'it' ? 'Seleziona...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.value} value={budget.value}>
                      {budget.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Informazioni Aggiuntive */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">
                {language === 'it' ? 'Informazioni Aggiuntive' : 'Additional Information'}
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder={language === 'it' 
                  ? 'Aggiungi qualsiasi altra informazione che ritieni utile per la valutazione...'
                  : 'Add any other information you think useful for the evaluation...'
                }
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="border-t pt-6">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="privacy"
                checked={formData.privacyAccepted}
                onCheckedChange={(checked) => handleInputChange('privacyAccepted', checked as boolean)}
              />
              <Label htmlFor="privacy" className="text-sm leading-5">
                {language === 'it' 
                  ? 'Accetto la Privacy Policy e autorizzo il trattamento dei miei dati personali per la gestione della richiesta di preventivo. I dati saranno utilizzati per generare un PDF personalizzato che verrà inviato via email e condiviso in chat con il nostro fitopatologo.' 
                  : 'I accept the Privacy Policy and authorize the processing of my personal data for managing the quote request. Data will be used to generate a personalized PDF that will be sent via email and shared in chat with our phytopathologist.'
                }
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center mt-8">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="px-8"
          disabled={isSubmitting}
        >
          {language === 'it' ? 'Indietro' : 'Back'}
        </Button>
        <Button 
          onClick={handleSubmit}
          className="px-8 bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-green hover:to-drplant-green-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {language === 'it' ? 'Generazione PDF...' : 'Generating PDF...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {language === 'it' ? 'Genera PDF e Invia' : 'Generate PDF and Send'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfessionalQuoteForm;