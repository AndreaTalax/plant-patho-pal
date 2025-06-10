
import { UserProfile } from './types';

/**
 * Converts raw user data to a structured UserProfile object.
 * @example
 * transformUserData(rawData)
 * {
 *   id: 1,
 *   email: "example@example.com",
 *   firstName: "John",
 *   lastName: "Doe",
 *   ...
 * }
 * @param {Object} data - Raw user data object containing user properties.
 * @returns {UserProfile} Structured user profile containing mapped data.
 * @description
 *   - The function assumes that input data properties are correctly spelled as per expectations.
 *   - Redundant keys exist for backward compatibility with different data sources.
 *   - Combines similar properties under unified object fields.
 */
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

/**
 * Transforms a partial user profile object to a database-compatible format.
 * @example
 * updates({ firstName: 'John', lastName: 'Doe', birthDate: '1990-01-01' })
 * // Returns: { first_name: 'John', last_name: 'Doe', birth_date: '1990-01-01', updated_at: '2023-10-05T12:34:56.789Z' }
 * @param {Partial<UserProfile>} updates - An object containing partial updates to a user profile, using camelCase keys.
 * @returns {Object} An object formatted with snake_case keys suitable for database operations.
 * @description
 *   - Converts camelCase property names to snake_case format for use in database fields.
 *   - Automatically appends an 'updated_at' timestamp with the current date and time.
 *   - Retains any additional properties that are not transformed, preserving their original key names.
 */
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
