
/**
 * Service for managing whitelisted account credentials and validation
 */

export const getWhitelistedCredentials = () => ({
  'agrotecnicomarconigro@gmail.com': 'marconigro93',
  'test@gmail.com': 'test123',
  'premium@gmail.com': 'premium123',
  'talaiaandrea@gmail.com': 'test1234'
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
  if (email === 'agrotecnicomarconigro@gmail.com') {
    return 'admin';
  } else if (email === 'test@gmail.com') {
    return 'admin';
  } else if (email.includes('marco') || email.includes('fitopatologo')) {
    return 'expert';
  }
  return 'user';
};

export const getUserDisplayName = (email: string): { firstName: string; lastName: string } => {
  switch (email) {
    case 'agrotecnicomarconigro@gmail.com':
      return { firstName: 'Marco', lastName: 'Nigro' };
    case 'test@gmail.com':
      return { firstName: 'Test', lastName: 'User' };
    case 'talaiaandrea@gmail.com':
      return { firstName: 'Andrea', lastName: 'Talaia' };
    default:
      return { firstName: 'User', lastName: 'Name' };
  }
};
