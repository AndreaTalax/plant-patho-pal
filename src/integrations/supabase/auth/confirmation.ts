
import { supabase } from '../client';
import { whitelistedEmails } from './mock-users';
import { ResendConfirmationResponse } from './types';

// Function to resend confirmation email
export const resendConfirmationEmail = async (email: string): Promise<ResendConfirmationResponse> => {
  try {
    // For whitelisted emails, simulate successful sending
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
