
import { UserProfile } from './types';

export const normalizeProfile = (data: any): UserProfile => {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username,
    birthDate: data.birth_date,
    birthPlace: data.birth_place,
    first_name: data.first_name,
    last_name: data.last_name,
    birth_date: data.birth_date,
    birth_place: data.birth_place,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatar_url,
    avatar_url: data.avatar_url,
    role: data.role,
    subscription_plan: data.subscription_plan,
  };
};

export const convertProfileUpdates = (updates: Partial<UserProfile>): any => {
  const dbUpdates: any = {};
  Object.keys(updates).forEach(key => {
    switch (key) {
      case 'firstName':
        dbUpdates.first_name = updates[key];
        break;
      case 'lastName':
        dbUpdates.last_name = updates[key];
        break;
      case 'birthDate':
        dbUpdates.birth_date = updates[key];
        break;
      case 'birthPlace':
        dbUpdates.birth_place = updates[key];
        break;
      case 'avatarUrl':
        dbUpdates.avatar_url = updates[key];
        break;
      default:
        dbUpdates[key] = updates[key];
    }
  });
  dbUpdates.updated_at = new Date().toISOString();
  return dbUpdates;
};

export const getWhitelistedEmails = (): string[] => [
  'test@gmail.com',
  'premium@gmail.com',
  'marco.nigro@drplant.it',
  'fitopatologo@drplant.it',
  'agrotecnicomarconigro@gmail.com' 
];
