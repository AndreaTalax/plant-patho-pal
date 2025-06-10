import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Renders a 404 error page when a non-existent route is accessed.
 * @example
 * NotFoundPage()
 * Renders a 404 error page with a message and a link to return to home.
 * @returns {JSX.Element} A JSX element representing the 404 error page.
 * @description
 *   - Logs an error message to the console indicating the user accessed a non-existent route.
 *   - Provides a styled interface with a message and a link to redirect to the homepage.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
