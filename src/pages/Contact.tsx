import { useState } from 'react';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Globe } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Il nome è obbligatorio" })
    .max(100, { message: "Il nome deve essere meno di 100 caratteri" }),
  email: z.string()
    .trim()
    .email({ message: "Email non valida" })
    .max(255, { message: "L'email deve essere meno di 255 caratteri" }),
  subject: z.string()
    .trim()
    .min(1, { message: "L'oggetto è obbligatorio" })
    .max(200, { message: "L'oggetto deve essere meno di 200 caratteri" }),
  message: z.string()
    .trim()
    .min(1, { message: "Il messaggio è obbligatorio" })
    .max(2000, { message: "Il messaggio deve essere meno di 2000 caratteri" })
});

/**
 * Handles form submission for sending a contact message.
 * @example
 * handleSubmit(event)
 * Logs the email details and clears the form after a simulated send.
 * @param {React.FormEvent} e - Event object representing the form submission.
 * @returns {void} No return value; performs side effects such as state updates and logging.
 * @description
 *   - Checks for empty fields and displays error toast if any field is missing.
 *   - Simulates sending an email with a delay, displaying success or error toast based on the outcome.
 *   - Logs the email contents to console for debugging purposes.
 *   - Resets the input fields after successful message send.
 */
const Contact = () => {
  const { t } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  /**
   * Handles form submission, validates fields, and simulates sending an email.
   * @example
   * sync(event)
   * // Initiates email sending process and updates UI based on success or failure
   * @param {React.FormEvent} e - The event triggered by form submission.
   * @returns {void} No return value. Side effects include UI updates and console logging.
   * @description
   *   - Uses console logs to mock email sending, ideal for development environments.
   *   - Toggles sending state for UI feedback.
   *   - Employs toast notifications for user feedback on form completion status.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with zod
    try {
      contactSchema.parse({ name, email, subject, message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    if (!name || !email || !subject || !message) {
      toast.error(t("fillAllFields"));
      return;
    }
    
    setIsSending(true);
    
    try {
      // Call edge function to send email
      const response = await fetch('https://otdmqmpxukifoxjlgzmq.supabase.co/functions/v1/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4'}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      toast.success(t("messageSent"));
      
      // Clear form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("errorSendingMessage"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-sky-50 to-white min-h-screen">
      <Header />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-drplant-blue text-center mb-4">
            {t("contactUs")}
          </h1>
          
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
            {t("contactUsDescription")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-drplant-blue/10 rounded-lg">
                      <Mail className="w-6 h-6 text-drplant-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t("emailUs")}</h3>
                      <a 
                        href="mailto:talaiaandrea@gmail.com" 
                        className="text-sm text-drplant-blue hover:underline"
                      >
                        talaiaandrea@gmail.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-drplant-blue/10 rounded-lg">
                      <Phone className="w-6 h-6 text-drplant-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t("callUs")}</h3>
                      <p className="text-sm text-gray-600">+39 123 456 7890</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-drplant-blue/10 rounded-lg">
                      <Globe className="w-6 h-6 text-drplant-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium">{t("visitUs")}</h3>
                      <p className="text-sm text-gray-600">Via Roma 123, Milano</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("yourName")}</label>
                        <Input 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t("enterYourName")}
                          maxLength={100}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("yourEmail")}</label>
                        <Input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("enterYourEmail")}
                          maxLength={255}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t("subject")}</label>
                      <Input 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={t("enterSubject")}
                        maxLength={200}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t("message")}</label>
                      <Textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("enterMessage")}
                        rows={6}
                        maxLength={2000}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-drplant-blue hover:bg-drplant-blue-dark"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <div className="flex items-center">
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {t("sending")}
                        </div>
                      ) : t("sendMessage")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
