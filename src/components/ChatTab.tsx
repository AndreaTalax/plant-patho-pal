
import { useAuth } from '@/context/auth'; // Updated import path
import ExpertChatView from './chat/ExpertChatView';
import UserChatView from './chat/UserChatView';

const ChatTab = () => {
  const { userProfile, isMasterAccount } = useAuth();
  
  // Early return if no user is logged in
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Please log in to access the chat</p>
      </div>
    );
  }
  
  // Render expert view for master account, user view for regular users
  return (
    <div className="flex flex-col min-h-full pt-3 pb-24">
      {isMasterAccount ? (
        <ExpertChatView userId={userProfile.email} />
      ) : (
        <UserChatView userId={userProfile.email} />
      )}
    </div>
  );
};

export default ChatTab;
