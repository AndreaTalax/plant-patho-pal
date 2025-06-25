
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verifica se l'utente è già autenticato
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    checkSession();
    
    // Listener per i cambiamenti di stato dell'autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
            <img 
              src="/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png" 
              alt="Dr.Plant Logo" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Dr.Plant</h1>
          <p className="text-gray-600 mt-2">Il tuo assistente per la cura delle piante</p>
        </div>

        <AuthForm />

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Dr.Plant. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  );
}
