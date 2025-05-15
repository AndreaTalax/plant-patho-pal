
import { ReactNode } from "react";
import { Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AuthPageLayoutProps {
  children: ReactNode;
}

export const AuthPageLayout = ({ children }: AuthPageLayoutProps) => {
  return (
    <div className="h-screen w-full bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
            <Leaf className="h-12 w-12 text-drplant-green" />
          </div>
          <h1 className="text-3xl font-bold text-drplant-blue-dark">Dr.Plant</h1>
          <p className="text-gray-600 mt-2">Register to get started</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          {children}
        </Card>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 Dr.Plant. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
