
import { ReactNode } from "react";
import { Leaf, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AuthPageLayoutProps {
  children: ReactNode;
}

export const AuthPageLayout = ({ children }: AuthPageLayoutProps) => {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-drplant-blue-light/30 via-white to-drplant-green/10 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-drplant-blue-light/20 to-transparent -z-10 rounded-b-[60%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-tl from-drplant-green/15 to-transparent -z-10 rounded-t-[40%]" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-drplant-green/10 rounded-full animate-pulse" />
      <div className="absolute top-40 right-32 w-12 h-12 bg-drplant-blue/10 rounded-full animate-pulse delay-1000" />
      <div className="absolute bottom-32 left-40 w-16 h-16 bg-drplant-green/10 rounded-full animate-pulse delay-500" />
      
      <div className="w-full max-w-md relative">
        {/* Logo section with enhanced styling */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="inline-flex items-center justify-center p-6 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-drplant-green/20 relative">
              <Leaf className="h-16 w-16 text-drplant-green" />
              <Sparkles className="h-6 w-6 text-drplant-blue absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent">
              Dr.Plant
            </h1>
            <p className="text-gray-600 text-lg font-medium">La tua diagnosi botanica AI</p>
            <p className="text-gray-500">Registrati per iniziare</p>
          </div>
        </div>

        {/* Auth card with enhanced styling */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-drplant-blue/5 to-drplant-green/5 pointer-events-none" />
          <div className="relative">
            {children}
          </div>
        </Card>

        {/* Footer with improved styling */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 text-sm bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl">
            <Leaf className="h-4 w-4 text-drplant-green" />
            <span>© 2025 Dr.Plant. Tutti i diritti riservati.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
