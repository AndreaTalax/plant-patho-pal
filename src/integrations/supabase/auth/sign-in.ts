
import { supabase } from '../client';
import { whitelistedEmails, mockPasswords, createMockUser, createMockSession } from './mock-users';

// User login function
export const signIn = async (email: string, password: string) => {
  try {
    // For specific emails, allow direct access without calling supabase.auth.signInWithPassword
    if (whitelistedEmails.includes(email.toLowerCase())) {
      const expectedPassword = mockPasswords[email.toLowerCase() as keyof typeof mockPasswords];
      
      if (password === expectedPassword) {
        console.log('Simulated login for whitelisted email:', email);
        
        // Create a mock user with the correct role
        const mockUser = createMockUser(email);
        
        // Create a mock session with the user
        const mockSession = createMockSession(mockUser);
        
        return {
          user: mockUser,
          session: mockSession
        };
      } else {
        throw new Error("Invalid login credentials");
      }
    }
    
    // For other emails, proceed normally with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is because email is not confirmed
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email not confirmed')) {
        console.warn('Email not confirmed:', error.message);
        throw new Error('email_not_confirmed');
      }
      
      console.error('Login error:', error.message);
      throw error;
    } else {
      console.log('Login successful');
      return data;
    }
  } catch (error: any) {
    console.error('Error during login:', error);
    throw error;
  }
};
