
import { UserProfile } from './types';

export const getWhitelistedEmails = (): string[] => {
  return [
    'test@gmail.com',
    'premium@gmail.com',
    'agrotecnicomarconigro@gmail.com', // Account principale Marco Nigro
    'marco.nigro@fitopatologo.it',
    'fitopatologo@gmail.com',
    'esperto@plantpathopal.com'
  ];
};

export const normalizeProfile = (profile: any): UserProfile => {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name || profile.firstName,
    lastName: profile.last_name || profile.lastName,
    first_name: profile.first_name,
    last_name: profile.last_name,
    username: profile.username,
    birthDate: profile.birth_date || profile.birthDate,
    birthPlace: profile.birth_place || profile.birthPlace,
    birth_date: profile.birth_date,
    birth_place: profile.birth_place,
    phone: profile.phone,
    address: profile.address,
    avatarUrl: profile.avatar_url || profile.avatarUrl,
    avatar_url: profile.avatar_url,
    role: profile.role,
    subscription_plan: profile.subscription_plan,
  };
};

export const convertProfileUpdates = (updates: any): any => {
  const converted: any = {};
  
  if (updates.firstName !== undefined) converted.first_name = updates.firstName;
  if (updates.lastName !== undefined) converted.lastName = updates.last_name;
  if (updates.birthDate !== undefined) converted.birth_date = updates.birthDate;
  if (updates.birthPlace !== undefined) converted.birth_place = updates.birthPlace;
  if (updates.avatarUrl !== undefined) converted.avatar_url = updates.avatarUrl;
  
  // Copy other fields directly
  Object.keys(updates).forEach(key => {
    if (!['firstName', 'lastName', 'birthDate', 'birthPlace', 'avatarUrl'].includes(key)) {
      converted[key] = updates[key];
    }
  });
  
  return converted;
};
