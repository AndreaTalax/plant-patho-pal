
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PlantInfoProvider } from "@/context/PlantInfoContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useUserPresence } from "@/hooks/useUserPresence";
import { usePostPaymentDiagnosis } from "@/hooks/usePostPaymentDiagnosis";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import CompleteProfile from "./pages/CompleteProfile";
import ResetPassword from "./pages/ResetPassword";
import SavedArticles from "./pages/SavedArticles";
import PlanSubscriptionSelection from "./pages/PlanSubscriptionSelection";
import PlanSelection from "./pages/PlanSelection";
import PlantIdentification from "./pages/PlantIdentification";
import { CDCDashboard } from "./components/cdc/CDCDashboard";
import { UserManagement } from "./components/admin/UserManagement";
import { NotificationSettings } from "./components/notifications/NotificationSettings";
import { NotificationProvider } from "./components/notifications/NotificationProvider";
import { PushNotificationManager } from "./components/notifications/PushNotificationManager";
import CookieConsent from "./components/CookieConsent";
import TestDiagnosi from "./pages/TestDiagnosi";
import ProfessionalQuote from "./pages/ProfessionalQuote";

const queryClient = new QueryClient();

// Component wrapper to initialize user presence and post-payment diagnosis
const AppWithPresence = ({ children }: { children: React.ReactNode }) => {
  useUserPresence();
  usePostPaymentDiagnosis(); // Gestisce automaticamente l'invio diagnosi dopo il pagamento
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <PushNotificationManager />
            <CookieConsent />
            <AppWithPresence>
              <PlantInfoProvider>
                <TooltipProvider>
                  <Toaster />
                <Router>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/plan-selection" element={<PlanSelection />} />
                    <Route path="/plan-subscription-selection" element={<PlanSubscriptionSelection />} />
                    <Route path="/professional-quote" element={<ProfessionalQuote />} />
                    <Route path="/plant-identification" element={<PlantIdentification />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/saved-articles" element={<SavedArticles />} />
                    <Route path="/cdc-dashboard" element={<CDCDashboard />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/notification-settings" element={<NotificationSettings />} />
                    <Route path="/test-diagnosi" element={<TestDiagnosi />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Router>
                </TooltipProvider>
              </PlantInfoProvider>
            </AppWithPresence>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
