
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
/**
 * Renders children or handles redirections based on authentication and profile completion status.
 * @example
 * ProtectedRoute({ children: <YourComponent /> })
 * <YourComponent />
 * @param {Object} { children: React.ReactNode } - The components that should be rendered if access is granted.
 * @returns {JSX.Element} Depending on the user's authentication status and profile completion, it returns either a loading spinner, a redirect component, or the children component.
 * @description
 *   - Utilizes the `useAuth` hook to determine authentication and profile status.
 *   - Displays a loading spinner while authentication status is being determined.
 *   - Redirects unauthenticated users to the login page.
 *   - Directs users with incomplete profiles (excluding master accounts) to the complete-profile page.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount, loading } = useAuth();
  
  console.log('ProtectedRoute - Auth status:', { isAuthenticated, isProfileComplete, isMasterAccount, loading });
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Skip profile completion for master accounts
  if (!isProfileComplete && !isMasterAccount) {
    console.log('Profile incomplete, redirecting to complete-profile');
    return <Navigate to="/complete-profile" replace />;
  }
  
  return <>{children}</>;
};

// Only used for complete-profile page
/**
 * Renders a loading screen, redirects based on authentication status or displays children components.
 * @example
 * renderFunction({ children: <MyComponent /> })
 * <MyComponent /> // When authenticated and profile is complete
 * @param {Object} { children: React.ReactNode } - Components to display if authentication and profile requirements are met.
 * @returns {ReactElement} A React element based on authentication and loading status.
 * @description
 *   - Uses useAuth hook to determine authentication and profile completion status.
 *   - Displays a spinner and message while loading.
 *   - Redirects to login page if not authenticated.
 *   - Redirects to homepage if profile is complete or user is a master account.
 */
const ProfileCompletionRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isProfileComplete, isMasterAccount, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Skip profile completion for master accounts
  if (isProfileComplete || isMasterAccount) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Auth route component (redirects if already logged in)
/**
* Renders different components based on authentication state.
* @example
* AuthWrapper({ children: <SomeComponent /> })
* Displays loading animation or redirects based on authentication.
* @param {{ children: React.ReactNode }} children - The component(s) to render when not authenticated.
* @returns {React.ReactElement} The appropriate component based on the user's authentication status.
* @description
*   - Uses a custom hook `useAuth` to access authentication state.
*   - Displays a loading spinner and message while authentication status is being fetched.
*   - Logs a console message when redirecting due to authentication.
*/
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-drplant-blue-light via-white to-drplant-green/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drplant-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    console.log('Already authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

/**
 * Configures and returns the application's route setup.
 * @example
 * renderRoutes()
 * Returns a JSX structure with a series of route configurations.
 * @returns {JSX} Contains the configuration of all application routes wrapped with appropriate route guards.
 * @description
 *   - Utilizes different route components such as AuthRoute, ProfileCompletionRoute, and ProtectedRoute to manage access. 
 *   - AuthRoute is used for login, signup, and auth pathways ensuring only unauthenticated access.
 *   - ProtectedRoute is applied to routes that require user authentication to access, such as home, about, services, and contact.
 *   - 404 functionality is handled by rendering a NotFound component for unmatched paths.
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <SignUp />
        </AuthRoute>
      } />
      <Route path="/auth" element={
        <AuthRoute>
          <Auth />
        </AuthRoute>
      } />
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

/**
 * Wraps the application component with several context providers.
 * @example
 * MyFunction()
 * <QueryClientProvider>...</QueryClientProvider>
 * @param {object} {queryClient} - Provides the configuration for the QueryClient.
 * @returns {JSX.Element} The wrapped application element with context providers.
 * @description
 *   - The function utilizes multiple providers to manage different aspects of the application state and functionality.
 *   - Includes routing functionality with BrowserRouter.
 *   - Applies theme customization using ThemeProvider.
 */
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
