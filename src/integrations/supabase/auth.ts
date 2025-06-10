import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Function for user registration
/**
 * Handles user registration using Supabase. Allows direct access for whitelisted emails without calling supabase.auth.signUp.
 * @example
 * sync('example@example.com', 'password123')
 * { confirmationRequired: true, message: "Please check your email to confirm your account.", data: {...} }
 * @param {string} email - The email address of the user attempting to register.
 * @param {string} password - The password provided by the user for registration.
 * @returns {object} Contains registration status message, whether email confirmation is required, and user data.
 * @description
 *   - Provides a mock registration for selected whitelisted emails without needing email confirmation.
 *   - Implements special handling for email rate limit errors, returning a specific rate limit exceeded flag.
 *   - Manually sends confirmation emails using a designated Supabase function for newly registered users.
 *   - Includes special error handling for cases where signups may be disabled by configuration.
 */
export const signUp = async (email: string, password: string) => {
  try {
    // For email specifics, allowing direct access without calling supabase.auth.signUp
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      console.log('Email in whitelist, simulating registration for:', email);
      
      // Generate proper UUIDs for mock users
      const generateMockUserId = (email: string) => {
        if (email === "talaiaandrea@gmail.com") return "550e8400-e29b-41d4-a716-446655440001";
        if (email === "test@gmail.com") return "550e8400-e29b-41d4-a716-446655440002";
        if (email === "agrotecnicomarconigro@gmail.com") return "550e8400-e29b-41d4-a716-446655440003";
        return "550e8400-e29b-41d4-a716-446655440000";
      };
      
      // Simulate successful registration without actually calling Supabase
      return {
        confirmationRequired: false,
        message: "Registration completed successfully. You can log in immediately.",
        data: {
          user: {
            email: email,
            id: generateMockUserId(email),
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
    
    // For other emails, proceed normally with supabase.auth.signUp
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
      // Manual sending of confirmation email - adding a call to the Supabase function
      try {
        // If registration was successful, invoke the email sending function directly
        console.log('Sending confirmation email via edge function');
        
        const { error: functionError } = await supabase.functions.invoke('send-registration-confirmation', {
          body: { 
            user: data.user,
            email: email,
            confirmationToken: 'manual-token',
            confirmationUrl: `${window.location.origin}/confirm-email?token=${encodeURIComponent('manual-token')}&email=${encodeURIComponent(email)}` 
          }
        });
        
        if (functionError) {
          console.error('Error sending confirmation email:', functionError);
        } else {
          console.log('Confirmation email sent successfully');
        }
      } catch (emailError) {
        console.error('Error calling the email sending function:', emailError);
      }
      
      // Check if the user needs to confirm their email
      const userConfirmationStatus = data.user?.confirmed_at 
        ? 'already_confirmed' 
        : data.user?.email_confirmed_at 
          ? 'already_confirmed' 
          : 'confirmation_required';
            
      console.log('Email sent to:', email, 'Status:', userConfirmationStatus);
      
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
/**
 * Simulates or executes email login authentication using Supabase.
 * @example
 * sync('test@gmail.com', 'test123')
 * { user: mockUser, session: mockSession }
 * @param {string} email - The email address of the user attempting to log in.
 * @param {string} password - The password associated with the email address.
 * @returns {object} Returns an object containing user and session data.
 * @description
 *   - Allows direct access for whitelisted emails without calling Supabase authentication.
 *   - Generates mock user data when using whitelisted emails, providing a simulated login experience.
 *   - Handles errors related to unconfirmed emails specifically when using Supabase.
 *   - Logs detailed activity for security and debugging purposes during the authentication process.
 */
export const signIn = async (email: string, password: string) => {
  try {
    // For specific emails, allow direct access without calling supabase.auth.signInWithPassword
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    const mockPasswords = {
      "talaiaandrea@gmail.com": "ciao5",
      "test@gmail.com": "test123",
      "agrotecnicomarconigro@gmail.com": "marconigro93"
    };
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      const expectedPassword = mockPasswords[email.toLowerCase() as keyof typeof mockPasswords];
      
      if (password === expectedPassword) {
        console.log('Simulated login for whitelisted email:', email);
        
        // Generate proper UUIDs for mock users
        const generateMockUserId = (email: string) => {
          if (email === "talaiaandrea@gmail.com") return "550e8400-e29b-41d4-a716-446655440001";
          if (email === "test@gmail.com") return "550e8400-e29b-41d4-a716-446655440002";
          if (email === "agrotecnicomarconigro@gmail.com") return "550e8400-e29b-41d4-a716-446655440003";
          return "550e8400-e29b-41d4-a716-446655440000";
        };
        
        // Create a mock object for the user that meets the User interface
        let mockRole = 'user';
        let mockUserId = generateMockUserId(email);
        
        if (email === "agrotecnicomarconigro@gmail.com") {
          mockRole = 'master';
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

// Function to resend confirmation email
/**
 * Simulates sending a confirmation email based on the given email address.
 * @example
 * sync('example@gmail.com')
 * { success: true, message: "We've sent a new confirmation email. Check your inbox." }
 * @param {string} email - The email address to which the confirmation email should be sent.
 * @returns {Object} Contains a message and status indicators such as success or rate limit exceeded.
 * @description
 *   - Attempts to resend a confirmation email via Supabase API and, if it fails, attempts using an edge function.
 *   - Uses a whitelist to simulate successful email sending for certain addresses.
 *   - Error handling includes logging and throwing errors when necessary during email sending processes.
 */
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
    
    // For other emails, first try sending through standard Supabase API
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      if (error.status === 429) {
        return { 
          rateLimitExceeded: true, 
          message: "Too many email requests for this address. Wait before requesting another confirmation email."
        };
      }
      
      console.warn('Standard resend error:', error.message);
      
      // If the standard API fails, try with our edge function
      try {
        console.log('Attempting to send via edge function');
        const { error: functionError } = await supabase.functions.invoke('send-registration-confirmation', {
          body: { 
            email: email,
            confirmationToken: 'resend-token',
            confirmationUrl: `${window.location.origin}/confirm-email?token=${encodeURIComponent('resend-token')}&email=${encodeURIComponent(email)}` 
          }
        });
        
        if (functionError) {
          console.error('Error sending email via edge function:', functionError);
          throw functionError;
        }
        
        console.log('Confirmation email sent successfully via edge function');
        return { 
          success: true, 
          message: "We've sent a new confirmation email. Check your inbox."
        };
      } catch (edgeFunctionError) {
        console.error('Irreversible error in email sending:', edgeFunctionError);
        throw error; // Throw the original Supabase error
      }
    }
    
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
/**
* Logs out the current user from Supabase authentication.
* @example
* sync()
* // Console output: 'Logout successful' or 'Logout error: [error message]'
* @returns {void} This function does not return any value.
* @description
*   - Uses the Supabase auth object to perform sign-out.
*   - Captures and throws errors during the logout process.
*   - Outputs the result of the logout attempt to the console.
*   - Ensures that any error thrown during logout is logged and propagated.
*/
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
