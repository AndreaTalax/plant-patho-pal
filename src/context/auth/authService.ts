
import { toast } from 'sonner';
import { UserProfile } from './types';
import { isWhitelistedEmail } from './credentialsService';
import { 
  authenticateWhitelistedUser, 
  authenticateRegularUser,
  registerUser as registerUserService,
  updateUserPassword as updatePasswordService,
  signOutUser as signOutService
} from './userAuthService';
import { 
  fetchUserProfile as fetchProfileService,
  createOrUpdateProfile as createUpdateProfileService,
  updateUserProfile as updateProfileService
} from './profileService';
import { ConnectionService } from '@/services/chat/connectionService';

/**
 * Main authentication service that orchestrates user authentication
 */
export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    console.log('Attempting login with:', email);
    
    const emailLower = email.toLowerCase();
    
    // Check if it's a whitelisted email
    if (isWhitelistedEmail(emailLower)) {
      return await authenticateWhitelistedUser(emailLower, password);
    }
    
    // Regular user authentication
    return await authenticateRegularUser(email, password);
    
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    const errorMessage = error?.message || 'Errore durante il login';
    throw new Error(errorMessage);
  }
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const operation = async () => {
    return await fetchProfileService(userId);
  };

  try {
    // Use ConnectionService for robust error handling
    const result = await ConnectionService.withRetry(
      operation,
      'Fetch user profile'
    );
    return result;
  } catch (error: any) {
    console.error('Error fetching user profile:', error?.message || error);
    return null;
  }
};

export const createOrUpdateProfile = createUpdateProfileService;
export const updateUserProfile = updateProfileService;
export const registerUser = registerUserService;
export const updateUserPassword = updatePasswordService;
export const signOutUser = signOutService;
