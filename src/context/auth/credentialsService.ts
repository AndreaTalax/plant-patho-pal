
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

export const determineUserRole = (email: string): string => {
  const emailLower = email.toLowerCase();
  if (emailLower === 'test@gmail.com') {
    return 'admin';
  }
  return 'user';
};

export const getUserDisplayName = (email: string): { firstName: string; lastName: string } => {
  const emailLower = email.toLowerCase();
  
  switch (emailLower) {
    case 'agrotecnicomarconigro@gmail.com':
      return { firstName: 'Marco', lastName: 'Nigro' };
    case 'test@gmail.com':
      return { firstName: 'Test', lastName: 'User' };
    case 'premium@gmail.com':
      return { firstName: 'Premium', lastName: 'User' };
    default:
      // For non-whitelisted users, extract name from email
      const username = email.split('@')[0];
      return { firstName: username, lastName: '' };
  }
};
