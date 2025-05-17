
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { useEffect } from "react";

const queryClient = new QueryClient();

// Auth status logger component
const AuthStatusLogger = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("Auth status:", { isAuthenticated, user, currentPath: location.pathname });
  }, [isAuthenticated, user, location]);
  
  return null;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount, isAdminAccount } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Skip profile completion check for master or admin accounts
  if (!isProfileComplete && !isMasterAccount && !isAdminAccount) {
    console.log("Profile not complete, redirecting to complete profile");
    return <Navigate to="/complete-profile" replace />;
  }
  
  return <>{children}</>;
};

// Profile completion route - only accessible when authenticated but profile not complete
const ProfileCompletionRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount, isAdminAccount } = useAuth();
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Skip profile completion for master or admin accounts
  if (isProfileComplete || isMasterAccount || isAdminAccount) {
    console.log("Profile complete or privileged account, redirecting to home");
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Public route - redirects to home if already authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (isAuthenticated) {
    console.log("User already authenticated, redirecting to home");
    // Get the redirect path from state or default to home
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignUp />
        </PublicRoute>
      } />
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

const AppWithProviders = () => (
  <>
    <AuthStatusLogger />
    <AppRoutes />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <PlantInfoProvider>
            <BrowserRouter>
              <AppWithProviders />
            </BrowserRouter>
          </PlantInfoProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
