
import { useState } from 'react';
import Header from '@/components/Header';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Globe } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const Contact = () => {
  const { t } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      toast.error(t("fillAllFields"));
      return;
    }
    
    setIsSending(true);
    
    try {
      // Log the email that would be sent
      console.log(`Sending email to: agrotecnicomarconigro@gmail.com`);
      console.log(`From: ${name} (${email})`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      
      // In a real app, this would be a backend API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
                        href="mailto:agrotecnicomarconigro@gmail.com" 
                        className="text-sm text-drplant-blue hover:underline"
                      >
                        agrotecnicomarconigro@gmail.com
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
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t("yourEmail")}</label>
                        <Input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("enterYourEmail")}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t("subject")}</label>
                      <Input 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={t("enterSubject")}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t("message")}</label>
                      <Textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("enterMessage")}
                        rows={6}
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
