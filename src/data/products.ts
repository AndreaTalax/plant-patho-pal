
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
    image_url: "/placeholder.svg"
  },
  {
    id: "2",
    name: "Insetticida Naturale Bio",
    description: "Protezione naturale contro insetti e parassiti senza prodotti chimici",
    price: 14.50,
    category: "Insetticidi",
    image_url: "/placeholder.svg"
  },
  {
    id: "3",
    name: "Terriccio Universale Premium",
    description: "Terriccio di alta qualità per ogni tipo di pianta, ricco di sostanze nutritive",
    price: 12.00,
    category: "Terricci",
    image_url: "/placeholder.svg"
  },
  {
    id: "4",
    name: "Vaso Autoirrigante Smart",
    description: "Vaso moderno con sistema di autoirrigazione integrato per piante d'appartamento",
    price: 25.00,
    category: "Vasi",
    image_url: "/placeholder.svg"
  },
  {
    id: "5",
    name: "Kit Germinazione Completo",
    description: "Tutto il necessario per far germinare e crescere le tue piante dai semi",
    price: 29.99,
    category: "Kit",
    image_url: "/placeholder.svg"
  },
  {
    id: "6",
    name: "Forbici da Potatura Professionali",
    description: "Forbici ergonomiche professionali in acciaio inox per la cura delle piante",
    price: 21.00,
    category: "Attrezzi",
    image_url: "/placeholder.svg"
  }
];
