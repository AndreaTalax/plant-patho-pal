
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PlantInfoProvider } from "@/context/PlantInfoContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useUserPresence } from "@/hooks/useUserPresence";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import CompleteProfile from "./pages/CompleteProfile";
import ResetPassword from "./pages/ResetPassword";
import { CDCDashboard } from "./components/cdc/CDCDashboard";
import { UserManagement } from "./components/admin/UserManagement";
import { NotificationSettings } from "./components/notifications/NotificationSettings";
import { NotificationProvider } from "./components/notifications/NotificationProvider";

const queryClient = new QueryClient();

// Component wrapper to initialize user presence
const AppWithPresence = ({ children }: { children: React.ReactNode }) => {
  useUserPresence();
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppWithPresence>
              <PlantInfoProvider>
                <TooltipProvider>
                  <Toaster />
                <Router>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/cdc-dashboard" element={<CDCDashboard />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/notification-settings" element={<NotificationSettings />} />
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
