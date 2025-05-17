
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth";
import { ThemeProvider } from "./context/ThemeContext";
import { PlantInfoProvider } from "./context/PlantInfoContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import CompleteProfile from "./pages/CompleteProfile";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/complete-profile" replace />;
  }
  
  // Skip profile completion check for master accounts
  if (!isProfileComplete && !isMasterAccount) {
    return <Navigate to="/complete-profile" replace />;
  }
  
  return <>{children}</>;
};

// Profile completion route - accessible even without authentication
const ProfileCompletionRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount } = useAuth();
  
  // Skip profile completion for master accounts and users with complete profile
  if (isAuthenticated && (isProfileComplete || isMasterAccount)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/complete-profile" element={
        <ProfileCompletionRoute>
          <CompleteProfile />
        </ProfileCompletionRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/about" element={
        <ProtectedRoute>
          <AboutUs />
        </ProtectedRoute>
      } />
      <Route path="/services" element={
        <ProtectedRoute>
          <Services />
        </ProtectedRoute>
      } />
      <Route path="/contact" element={
        <ProtectedRoute>
          <Contact />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/complete-profile" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <PlantInfoProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </PlantInfoProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
