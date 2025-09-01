
import { useAuth } from '@/context/AuthContext';
import ProfessionalExpertDashboard from './ProfessionalExpertDashboard';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

const ExpertDashboard = () => {
  const { userProfile } = useAuth();

  // Check if current user is Marco Nigro (expert)
  const isMarcoNigro = userProfile?.id === MARCO_NIGRO_ID || 
                       userProfile?.email === 'agrotecnicomarconigro@gmail.com';

  if (!isMarcoNigro) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Accesso non autorizzato</p>
      </div>
    );
  }

  return <ProfessionalExpertDashboard />;
};

export default ExpertDashboard;
