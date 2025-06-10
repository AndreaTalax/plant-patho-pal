
import { useAuth } from '@/context/AuthContext';
import ExpertDashboard from './expert/ExpertDashboard';

/**
* Conditionally renders a message or component based on account type.
* @example
* expertTabComponent()
* <div className="flex justify-center items-center h-full"><p className="text-gray-500">Accesso non autorizzato</p></div>
* @param {none} - No parameters are expected for this function.
* @returns {JSX.Element} Returns a JSX element, either a message or the `ExpertDashboard`.
* @description
*   - Renders an unauthorized access message for non-master accounts.
*   - Uses `useAuth` hook for account type checking.
*   - Displays `ExpertDashboard` for master accounts.
*   - Applies CSS classes for centered alignment and text styling.
*/
const ExpertTab = () => {
  const { isMasterAccount } = useAuth();

  if (!isMasterAccount) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Accesso non autorizzato</p>
      </div>
    );
  }

  return <ExpertDashboard />;
};

export default ExpertTab;
