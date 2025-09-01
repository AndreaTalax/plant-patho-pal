
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PlantInfoProvider } from './context/PlantInfoContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { Toaster } from './components/ui/sonner';

// Import pages
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CompleteProfile from './pages/CompleteProfile';
import ResetPassword from './pages/ResetPassword';
import AboutUs from './pages/AboutUs';
import Services from './pages/Services';
import Contact from './pages/Contact';
import SavedArticles from './pages/SavedArticles';
import NotFound from './pages/NotFound';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PlantInfoProvider>
            <NotificationProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-gray-50">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/saved-articles" element={<SavedArticles />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </div>
                <Toaster />
              </BrowserRouter>
            </NotificationProvider>
          </PlantInfoProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
