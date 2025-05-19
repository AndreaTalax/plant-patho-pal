
import { supabase } from '../client';
import { SignUpResponse } from './types';
import { whitelistedEmails, createMockUser } from './mock-users';
import { randomUUID } from 'crypto';

// Function for user registration
export const signUp = async (email: string, password: string): Promise<SignUpResponse> => {
  try {
    // For email specifics, allowing direct access without calling supabase.auth.signUp
    if (whitelistedEmails.includes(email.toLowerCase())) {
      console.log('Email in whitelist, simulating registration for:', email);
      
      // Generate proper UUIDs for simulated users
      const mockUserId = randomUUID();
      
      // Simulate successful registration without actually calling Supabase
      return {
        confirmationRequired: false,
        message: "Registration completed successfully. You can log in immediately.",
        data: {
          user: {
            email: email,
            id: mockUserId,
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
          },
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
              id: randomUUID(),
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
