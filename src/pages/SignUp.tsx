
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { register } = useAuth();

  const onSubmit = async (values: { email: string; password: string; confirmPassword: string }) => {
    setIsLoading(true);
    
    try {
      // Clear any previous toasts
      toast.dismiss();
      
      await register(values.email, values.password);
      setRegisteredEmail(values.email);
      setEmailSent(true);
      
      toast.success("Registrazione completata", {
        description: "Ti abbiamo inviato un'email di conferma. Controlla la tua casella di posta.",
        duration: 8000,
        dismissible: true,
      });
    } catch (error: any) {
      console.error("Errore registrazione:", error);
      let errorMessage = "Si è verificato un problema durante la registrazione";
      
      if (error.message?.includes("weak_password")) {
        errorMessage = "La password è troppo debole. Deve contenere almeno 6 caratteri.";
      } else if (error.message?.includes("already registered")) {
        errorMessage = "Questo indirizzo email è già registrato. Prova ad accedere.";
      }
      
      toast.error("Errore registrazione", {
        description: errorMessage,
        duration: 8000,
        dismissible: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Controlla la tua email</h2>
          <p className="text-gray-600 mb-6">
            Abbiamo inviato un'email di conferma a <span className="font-medium">{registeredEmail}</span>.<br />
            Clicca sul link nell'email per completare la registrazione.
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              Non hai ricevuto l'email?
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Controlla nella cartella spam o nella posta indesiderata.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-drplant-green/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/2be72d96-649b-4a40-a1e0-fea41cc64fc8.png" 
              alt="Dr.Plant Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-drplant-green mb-2">Dr.Plant</h1>
          <p className="text-gray-600 text-lg">La tua diagnosi botanica AI</p>
          <p className="text-gray-500 mt-2">Registrati per iniziare</p>
        </div>

        {/* Registration Form */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-drplant-blue mb-2">Create an account</h2>
            <p className="text-gray-600">Enter your details to register</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            const confirmPassword = formData.get('confirmPassword') as string;
            
            if (password !== confirmPassword) {
              toast.error("Le password non coincidono");
              return;
            }
            
            onSubmit({ email, password, confirmPassword });
          }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-drplant-blue focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-drplant-blue focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-drplant-blue focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark text-white font-medium py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-drplant-blue font-medium hover:underline">
              Login
            </a>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            By registering, you agree to our terms of service and privacy policy.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
