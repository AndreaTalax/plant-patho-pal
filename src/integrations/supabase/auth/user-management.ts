
import { supabase } from '../client';

// User logout function
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error.message);
      throw error;
    } else {
      console.log('Logout successful');
    }
  } catch (error: any) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Function to delete a user (reset)
export const deleteUser = async (userId: string) => {
  try {
    // This functionality requires the service_role, so it must be executed from the backend
    // Here we implement a simulation function for the interface
    console.error('User deletion must be executed from the backend with service_role');
    throw new Error('Functionality not available from the frontend');
  } catch (error: any) {
    console.error('Error during user deletion:', error);
    throw error;
  }
};
