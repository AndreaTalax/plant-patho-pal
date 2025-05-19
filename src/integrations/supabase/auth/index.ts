
// Export all authentication functions from the auth module
export { signUp } from './sign-up';
export { signIn } from './sign-in';
export { signOut, deleteUser } from './user-management';
export { resendConfirmationEmail } from './confirmation';
export type { SignUpResponse, ResendConfirmationResponse } from './types';
