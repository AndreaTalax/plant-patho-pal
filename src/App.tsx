
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PlantInfoProvider } from "@/context/PlantInfoContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useUserPresence } from "@/hooks/useUserPresence";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import CompleteProfile from "./pages/CompleteProfile";

const queryClient = new QueryClient();

// Component wrapper to initialize user presence
const AppWithPresence = ({ children }: { children: React.ReactNode }) => {
  useUserPresence();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AppWithPresence>
          <PlantInfoProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/complete-profile" element={<CompleteProfile />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </PlantInfoProvider>
        </AppWithPresence>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
