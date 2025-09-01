
/**
 * Service for managing whitelisted account credentials and validation
 */

export const getWhitelistedCredentials = () => ({
  'agrotecnicomarconigro@gmail.com': 'marconigro93',
  'test@gmail.com': 'test123', // Account di test premium
  'premium@gmail.com': 'premium123',
  'talaiaandrea@gmail.com': 'test123' // Account utente normale
});

export const isWhitelistedEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  return Object.keys(getWhitelistedCredentials()).includes(emailLower);
};

export const getExpectedPassword = (email: string): string | null => {
  const emailLower = email.toLowerCase();
  const credentials = getWhitelistedCredentials();
  return credentials[emailLower as keyof typeof credentials] || null;
};

export const determineUserRole = (email: string): string => {
  const emailLower = email.toLowerCase();
  
  if (emailLower === 'agrotecnicomarconigro@gmail.com') {
    return 'admin';
  } else if (emailLower === 'test@gmail.com') {
    return 'admin'; // Account di test con privilegi admin e premium
  } else if (emailLower.includes('marco') || emailLower.includes('fitopatologo')) {
    return 'expert';
  }
  return 'user'; // talaiaandrea@gmail.com sarà un utente normale
};

export const getUserDisplayName = (email: string): { firstName: string; lastName: string } => {
  const emailLower = email.toLowerCase();
  
  switch (emailLower) {
    case 'agrotecnicomarconigro@gmail.com':
      return { firstName: 'Marco', lastName: 'Nigro' };
    case 'test@gmail.com':
      return { firstName: 'Test', lastName: 'Premium' };
    case 'premium@gmail.com':
      return { firstName: 'Premium', lastName: 'User' };
    case 'talaiaandrea@gmail.com':
      return { firstName: 'Andrea', lastName: 'Talaia' };
    default:
      return { firstName: 'User', lastName: 'Name' };
  }
};

/**
 * Verifica se l'utente è un account di test con accesso completo
 */
export const isTestAccount = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  return [
    'test@gmail.com', // Account premium per test
    'agrotecnicomarconigro@gmail.com',
    'premium@gmail.com'
  ].includes(emailLower);
};

/**
 * Verifica se l'utente può accedere a funzionalità di testing
 */
export const canAccessTestFeatures = (email: string): boolean => {
  return isTestAccount(email);
};
