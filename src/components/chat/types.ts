
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'expert';
  time: string;
  products?: Product[];
  plantImage?: string;
  plantDetails?: any;
  userDetails?: any;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  expertId?: string;
  username?: string;
  blocked?: boolean;
  messages?: Message[];
  unread?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  specialty?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export const EXPERT: User = {
  id: 'expert-001',
  name: 'Dott. Marco Rossi',
  avatar: '/placeholder.svg',
  isOnline: true,
  specialty: 'Fitopatologo Specializzato'
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Fertilizzante Biologico',
    description: 'Fertilizzante organico per piante da appartamento',
    price: 15.99,
    image: '/placeholder.svg'
  },
  {
    id: 'prod-002',
    name: 'Antiparassitario Naturale',
    description: 'Spray naturale contro parassiti delle piante',
    price: 12.50,
    image: '/placeholder.svg'
  },
  {
    id: 'prod-003',
    name: 'Terriccio Premium',
    description: 'Terriccio arricchito per piante da interno',
    price: 8.99,
    image: '/placeholder.svg'
  }
];

// Database types
export interface DatabaseMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  conversation_id: string;
  text: string;
  sent_at: string;
  read: boolean;
  products?: any;
  metadata?: any;
}

export interface DatabaseConversation {
  id: string;
  user_id: string;
  expert_id: string | null;
  title: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  last_message_text?: string | null;
  user?: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface DatabaseProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}
