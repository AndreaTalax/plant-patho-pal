
import { randomUUID } from 'crypto';
import { User, Session } from '@supabase/supabase-js';

// Whitelist of emails that can be automatically logged in
export const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];

// Mock passwords for whitelisted emails
export const mockPasswords: Record<string, string> = {
  "talaiaandrea@gmail.com": "ciao5",
  "test@gmail.com": "test123",
  "agrotecnicomarconigro@gmail.com": "marconigro93"
};

// Create a mock user with all required fields
export const createMockUser = (email: string): User => {
  let mockRole = email === "agrotecnicomarconigro@gmail.com" ? 'master' : 'user';
  
  // Get or create a UUID for this mock user
  let mockUserId: string = getMockUserId(email);
  
  return {
    id: mockUserId,
    email: email,
    user_metadata: { role: mockRole },
    app_metadata: { provider: "email" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phone: null,
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: null,
    email_confirmed_at: new Date().toISOString(),
    identities: [],
    factors: []
  };
};

// Create a mock session with all required fields
export const createMockSession = (user: User): Session => {
  return {
    access_token: "mock-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    expires_at: new Date().getTime() / 1000 + 3600,
    token_type: "bearer",
    user: user
  };
};

// Get or create a UUID for a mock user
export const getMockUserId = (email: string): string => {
  // Store generated UUID in localStorage to maintain consistency between sessions
  const storedUserId = localStorage.getItem(`mockuser-${email}`);
  if (storedUserId) {
    return storedUserId;
  } else {
    const newId = randomUUID();
    localStorage.setItem(`mockuser-${email}`, newId);
    return newId;
  }
};
