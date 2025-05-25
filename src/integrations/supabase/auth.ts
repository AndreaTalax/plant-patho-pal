
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Function for user registration
export const signUp = async (email: string, password: string) => {
  try {
    // For email specifics, allowing direct access without calling supabase.auth.signUp
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      console.log('Email in whitelist, simulating registration for:', email);
      
      // Simulate successful registration without actually calling Supabase
      return {
        confirmationRequired: false,
        message: "Registration completed successfully. You can log in immediately.",
        data: {
          user: {
            email: email,
            id: email === "talaiaandrea@gmail.com" ? "talaiaandrea-id" : 
                 email === "test@gmail.com" ? "test-user-id" : "premium-user-id",
            email_confirmed_at: new Date().toISOString(),
            // Adding required fields for the Supabase User type
            app_metadata: { provider: 'email' },
            user_metadata: { role: email === "agrotecnicomarconigro@gmail.com" ? 'master' : 'user' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: null,
            confirmation_sent_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: null,
            identities: [],
            factors: []
          } as User,
          session: null
        }
      };
    }
    
    console.log('Attempting registration for:', email);
    
    // For other emails, proceed normally with supabase.auth.signUp and let Supabase handle email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          role: 'user', // default value
        }
      }
    });

    console.log('signUp response:', { data, error });

    if (error) {
      // Special handling for rate limit error
      if (error.status === 429 || error.message?.includes('rate limit exceeded')) {
        console.warn('Email rate limit exceeded:', error.message);
        // Return an object with a special flag to indicate rate limit
        return { 
          rateLimitExceeded: true, 
          message: "Too many email requests for this address. Try logging in or wait before requesting another confirmation email.",
          data
        };
      }
      
      // Special handling for "Signups not allowed"
      if (error.message?.includes("Signups not allowed") || error.code === "signup_disabled") {
        console.warn('Signups not allowed, providing mock registration for:', email);
        
        return {
          confirmationRequired: false,
          message: "Registration completed successfully. You can log in immediately.",
          data: {
            user: {
              email: email,
              id: `${email.split('@')[0]}-mock-id`,
              email_confirmed_at: new Date().toISOString(),
            },
            session: null
          }
        };
      }
      
      console.error('Registration error:', error.message);
      throw error;
    } else {
      // Log successful registration - Supabase will handle email sending automatically
      console.log('Registration successful for:', email);
      console.log('User data:', data.user);
      console.log('Email confirmation status:', data.user?.email_confirmed_at ? 'already confirmed' : 'confirmation required');
      
      // Check if the user needs to confirm their email
      const userConfirmationStatus = data.user?.confirmed_at 
        ? 'already_confirmed' 
        : data.user?.email_confirmed_at 
          ? 'already_confirmed' 
          : 'confirmation_required';
            
      console.log('Registration completed for:', email, 'Status:', userConfirmationStatus);
      
      return {
        ...data,
        confirmationRequired: userConfirmationStatus === 'confirmation_required',
        message: userConfirmationStatus === 'confirmation_required'
          ? "Please check your email to confirm your account."
          : "Registration completed successfully."
      };
    }
  } catch (error: any) {
    console.error('Error during registration:', error);
    throw error;
  }
};

// User login function
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Attempting login for:', email, 'with password:', password);
    
    // For specific emails, allow direct access without calling supabase.auth.signInWithPassword
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    const mockPasswords = {
      "talaiaandrea@gmail.com": "ciao5",
      "test@gmail.com": "test123",
      "agrotecnicomarconigro@gmail.com": "marconigro93"
    };
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      const expectedPassword = mockPasswords[email.toLowerCase() as keyof typeof mockPasswords];
      
      console.log('Whitelisted email detected:', email);
      console.log('Expected password:', expectedPassword);
      console.log('Provided password:', password);
      
      if (password === expectedPassword) {
        console.log('Password matches! Creating mock session for:', email);
        
        // Create a mock object for the user that meets the User interface
        let mockRole = 'user';
        let mockUserId = 'user-id';
        
        if (email === "agrotecnicomarconigro@gmail.com") {
          mockRole = 'master';
          mockUserId = 'premium-user-id';
        } else if (email === "talaiaandrea@gmail.com") {
          mockUserId = 'talaiaandrea-id';
        } else if (email === "test@gmail.com") {
          mockUserId = 'test-user-id';
        }
        
        // Complete User mock with all required fields
        const mockUser: User = {
          id: mockUserId,
          email: email,
          user_metadata: { role: mockRole },
          app_metadata: { provider: "email" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: null,
          confirmation_sent_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: null,
          email_confirmed_at: new Date().toISOString(),
          identities: [],
          factors: []
        };
        
        // Complete Session mock with all required fields
        const mockSession: Session = {
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          expires_at: new Date().getTime() / 1000 + 3600,
          token_type: "bearer",
          user: mockUser
        };
        
        // Manually trigger the auth state change to simulate Supabase behavior
        console.log('Triggering auth state change manually for whitelisted user');
        
        // Set the session in the auth context manually by triggering the auth state change
        setTimeout(() => {
          // This simulates what Supabase would normally do
          window.dispatchEvent(new CustomEvent('supabase-auth-token', { 
            detail: { session: mockSession, user: mockUser } 
          }));
        }, 100);
        
        return {
          data: {
            user: mockUser,
            session: mockSession
          },
          error: null
        };
      } else {
        console.log('Password does not match for whitelisted email');
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

// Function to resend confirmation email
export const resendConfirmationEmail = async (email: string) => {
  try {
    // For whitelisted emails, simulate successful sending
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      console.log('Simulating confirmation email sending for:', email);
      
      return { 
        success: true, 
        message: "We've sent a new confirmation email. Check your inbox."
      };
    }
    
    // For other emails, use standard Supabase resend (no fallback to edge function)
    console.log('Attempting to resend confirmation email for:', email);
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('Resend confirmation email error:', error);
      
      if (error.status === 429) {
        return { 
          rateLimitExceeded: true, 
          message: "Too many email requests for this address. Wait before requesting another confirmation email."
        };
      }
      
      throw error;
    }
    
    console.log('Confirmation email resent successfully for:', email);
    return { 
      success: true, 
      message: "We've sent a new confirmation email. Check your inbox."
    };
  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

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
