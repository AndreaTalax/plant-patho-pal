
/**
 * Centralized service for managing whitelisted credentials
 */

// Whitelisted emails and their expected passwords
const WHITELISTED_CREDENTIALS = Object.freeze({
  'agrotecnicomarconigro@gmail.com': 'marconigro93',
  'test@gmail.com': 'test123',
  'premium@gmail.com': 'premium123'
});

export const isWhitelistedEmail = (email: string): boolean => {
  return email.toLowerCase() in WHITELISTED_CREDENTIALS;
};

export const getExpectedPassword = (email: string): string => {
  const emailLower = email.toLowerCase();
  return WHITELISTED_CREDENTIALS[emailLower as keyof typeof WHITELISTED_CREDENTIALS] || '';
};

export const getWhitelistedCredentials = () => {
  return WHITELISTED_CREDENTIALS;
};
