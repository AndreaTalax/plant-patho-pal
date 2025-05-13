
import type { Database } from '@/integrations/supabase/types';
import { DbMessage, DbConversation } from '@/integrations/supabase/client';

// Type definitions for messages and products
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  products?: Product[];
}

// Using the helper types from client.ts but with our own customizations
export interface DatabaseMessage extends DbMessage {
  products: Product[] | null;
}

export interface Conversation {
  id: string;
  username: string;
  lastMessage: string;
  unread: boolean;
  blocked: boolean;
  messages: Message[];
}

export interface DatabaseConversation extends DbConversation {
  user?: {
    id: string;
    username: string;
  };
  expert?: {
    id: string;
    username: string;
  };
}

// Marco Nigro's expert data
export const EXPERT = {
  id: "premium-user-id",
  name: 'Plant Pathologist Marco Nigro', 
  specialty: 'Plant Diagnosis and Treatment', 
  avatar: '/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png',
  email: 'agrotecnicomarconigro@gmail.com'
};

// Mock data for available products
export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'prod1', 
    name: 'Organic Fungicide', 
    description: 'Natural fungicide for treating various plant diseases', 
    price: 19.99,
    image: '/lovable-uploads/1cb629ef-f7f2-4b66-a48a-5f22564bb3fa.png'
  },
  { 
    id: 'prod2', 
    name: 'Plant Nutrient Solution', 
    description: 'Complete nutrient mix for healthy plant growth', 
    price: 24.99,
    image: '/lovable-uploads/c8ba9199-f82d-4a4f-a6ae-1c8e340ed1b5.png'
  },
  { 
    id: 'prod3', 
    name: 'Pest Control Spray', 
    description: 'Effective against common garden pests', 
    price: 15.99,
    image: '/placeholder.svg'
  }
];
