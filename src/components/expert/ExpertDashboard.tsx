
import { useAuth } from '@/context/AuthContext';
import ProfessionalExpertDashboard from './ProfessionalExpertDashboard';

const ExpertDashboard = () => {
  const { isMasterAccount } = useAuth();

  if (!isMasterAccount) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Accesso non autorizzato</p>
      </div>
    );
  }

  return <ProfessionalExpertDashboard />;
};

export default ExpertDashboard;
