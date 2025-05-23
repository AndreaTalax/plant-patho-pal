
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PlantInfoProvider } from "./context/PlantInfoContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import CompleteProfile from "./pages/CompleteProfile";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isMasterAccount } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Skip profile completion requirement for all users
  return <>{children}</>;
};

// Only used for complete-profile page
const ProfileCompletionRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Skip profile completion for master accounts
  if (isProfileComplete || isMasterAccount) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
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
      <Route path="*" element={<NotFound />} />
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
