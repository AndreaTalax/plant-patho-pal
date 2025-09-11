import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, Users, Briefcase } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";

interface ProfessionalQuoteFormProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
}

const ProfessionalQuoteForm = ({ onBack, onSubmit }: ProfessionalQuoteFormProps) => {
  const { language } = useTheme();
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    companySize: '',
    sector: '',
    expectedUsage: '',
    specificNeeds: '',
    timeline: '',
    budget: '',
    privacyAccepted: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validazione base
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone) {
      toast.error(language === 'it' ? 'Compilare tutti i campi obbligatori' : 'Please fill all required fields');
      return;
    }

    if (!formData.privacyAccepted) {
      toast.error(language === 'it' ? 'Accetta la privacy policy per continuare' : 'Accept privacy policy to continue');
      return;
    }

    onSubmit(formData);
    toast.success(language === 'it' ? 'Richiesta inviata con successo!' : 'Request sent successfully!');
  };

  const companySizes = [
    { value: '1-10', label: '1-10 dipendenti' },
    { value: '11-50', label: '11-50 dipendenti' },
    { value: '51-200', label: '51-200 dipendenti' },
    { value: '201-500', label: '201-500 dipendenti' },
    { value: '500+', label: '500+ dipendenti' }
  ];

  const sectors = [
    { value: 'agriculture', label: language === 'it' ? 'Agricoltura' : 'Agriculture' },
    { value: 'nursery', label: language === 'it' ? 'Vivaismo' : 'Nursery' },
    { value: 'research', label: language === 'it' ? 'Ricerca' : 'Research' },
    { value: 'consulting', label: language === 'it' ? 'Consulenza' : 'Consulting' },
    { value: 'education', label: language === 'it' ? 'Formazione' : 'Education' },
    { value: 'other', label: language === 'it' ? 'Altro' : 'Other' }
  ];

  const budgets = [
    { value: '5000-10000', label: '€5.000 - €10.000' },
    { value: '10000-25000', label: '€10.000 - €25.000' },
    { value: '25000-50000', label: '€25.000 - €50.000' },
    { value: '50000+', label: '€50.000+' },
    { value: 'custom', label: language === 'it' ? 'Budget personalizzato' : 'Custom budget' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-drplant-blue-dark mb-4">
          {language === 'it' ? 'Richiesta Preventivo Professionale' : 'Professional Quote Request'}
        </h2>
        <p className="text-gray-600">
          {language === 'it' 
            ? 'Compila il modulo per ricevere un\'offerta personalizzata per la tua azienda'
            : 'Fill out the form to receive a customized offer for your company'
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
              <Input
                id="phone"
                placeholder="+39 xxx xxx xxxx"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Dettagli Aziendali */}
          <div className="space-y-2">
            <Label htmlFor="sector">
              {language === 'it' ? 'Settore' : 'Sector'}
            </Label>
            <Select onValueChange={(value) => handleInputChange('sector', value)}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'it' ? 'Seleziona...' : 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.value} value={sector.value}>
                    {sector.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Esigenze Specifiche */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expectedUsage">
                {language === 'it' ? 'Utilizzo Previsto' : 'Expected Usage'}
              </Label>
              <Textarea
                id="expectedUsage"
                placeholder={language === 'it' 
                  ? 'Descrivi come intendi utilizzare Dr.Plant nella tua organizzazione...'
                  : 'Describe how you plan to use Dr.Plant in your organization...'
                }
                value={formData.expectedUsage}
                onChange={(e) => handleInputChange('expectedUsage', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specificNeeds">
                {language === 'it' ? 'Esigenze Specifiche' : 'Specific Needs'}
              </Label>
              <Textarea
                id="specificNeeds"
                placeholder={language === 'it' 
                  ? 'Hai esigenze particolari o funzionalità specifiche richieste?'
                  : 'Do you have particular needs or specific features required?'
                }
                value={formData.specificNeeds}
                onChange={(e) => handleInputChange('specificNeeds', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeline">
                  {language === 'it' ? 'Timeline Implementazione' : 'Implementation Timeline'}
                </Label>
                <Select onValueChange={(value) => handleInputChange('timeline', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'it' ? 'Seleziona...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">{language === 'it' ? 'Immediata' : 'Immediate'}</SelectItem>
                    <SelectItem value="1-month">{language === 'it' ? 'Entro 1 mese' : 'Within 1 month'}</SelectItem>
                    <SelectItem value="3-months">{language === 'it' ? 'Entro 3 mesi' : 'Within 3 months'}</SelectItem>
                    <SelectItem value="6-months">{language === 'it' ? 'Entro 6 mesi' : 'Within 6 months'}</SelectItem>
                  </SelectContent>
                </Select>
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
                  ? 'Accetto la Privacy Policy e autorizzo il trattamento dei miei dati personali per la gestione della richiesta di preventivo. I dati saranno utilizzati esclusivamente per fornire informazioni sui servizi richiesti.' 
                  : 'I accept the Privacy Policy and authorize the processing of my personal data for managing the quote request. Data will be used exclusively to provide information about the requested services.'
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
        >
          {language === 'it' ? 'Indietro' : 'Back'}
        </Button>
        <Button 
          onClick={handleSubmit}
          className="px-8 bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-green hover:to-drplant-green-dark"
        >
          {language === 'it' ? 'Invia Richiesta' : 'Send Request'}
        </Button>
      </div>
    </div>
  );
};

export default ProfessionalQuoteForm;