
import { useAuth } from '@/context/AuthContext';
import ExpertDashboard from './expert/ExpertDashboard';

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
