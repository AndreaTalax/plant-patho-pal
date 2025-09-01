
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Concime Biologico Universale",
    description: "Concime organico naturale per tutte le piante, ricco di nutrienti essenziali",
    price: 19.99,
    category: "Concimi",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: "2",
    name: "Insetticida Naturale Bio",
    description: "Protezione naturale contro insetti e parassiti senza prodotti chimici",
    price: 14.50,
    category: "Insetticidi", 
    image_url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: "3",
    name: "Terriccio Universale Premium",
    description: "Terriccio di alta qualità per ogni tipo di pianta, ricco di sostanze nutritive",
    price: 12.00,
    category: "Terricci",
    image_url: "https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: "4",
    name: "Vaso Autoirrigante Smart",
    description: "Vaso moderno con sistema di autoirrigazione integrato per piante d'appartamento",
    price: 25.00,
    category: "Vasi",
    image_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: "5",
    name: "Kit Germinazione Completo",
    description: "Tutto il necessario per far germinare e crescere le tue piante dai semi",
    price: 29.99,
    category: "Kit",
    image_url: "https://images.unsplash.com/photo-1416198972681-ef2d9b0821c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  },
  {
    id: "6",
    name: "Forbici da Potatura Professionali",
    description: "Forbici ergonomiche professionali in acciaio inox per la cura delle piante",
    price: 21.00,
    category: "Attrezzi",
    image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  }
];
