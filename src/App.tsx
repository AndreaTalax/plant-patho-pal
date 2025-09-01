
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PlantInfoProvider } from "@/context/PlantInfoContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import CompleteProfile from "./pages/CompleteProfile";
import TestDiagnosi from "./pages/TestDiagnosi";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import SavedArticles from "./pages/SavedArticles";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <PlantInfoProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <BrowserRouter>
                    <div className="min-h-screen bg-background">
                      <Toaster />
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/complete-profile" element={<CompleteProfile />} />
                        <Route path="/test-diagnosi" element={<TestDiagnosi />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/saved-articles" element={<SavedArticles />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </BrowserRouter>
                </TooltipProvider>
              </NotificationProvider>
            </PlantInfoProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
