import { Product, SuggestedQuery } from '../types/shared';

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Classic Leather Tote",
    brand: "Fashion Forward",
    category: "bags",
    subcategory: "tote",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Spacious leather tote perfect for everyday use",
    tags: ["leather", "tote", "everyday", "spacious"],
    colors: ["brown", "black", "tan"],
    color: "brown",
    material: "leather",
    features: ["leather", "adjustable straps", "multiple compartments"]
  },
  {
    id: "2",
    name: "Travel Backpack",
    brand: "Adventure Gear",
    category: "bags",
    subcategory: "backpack",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Durable backpack ideal for travel and daily use",
    tags: ["backpack", "travel", "durable", "everyday"],
    colors: ["black", "navy", "gray"],
    color: "black",
    material: "nylon",
    features: ["waterproof", "laptop compartment", "usb charging port"]
  },
  {
    id: "3",
    name: "Phone Wallet",
    brand: "TechStyle",
    category: "accessories",
    subcategory: "wallet",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Slim wallet designed to fit your phone",
    tags: ["wallet", "phone", "slim", "compact"],
    colors: ["black", "brown", "blue"],
    color: "black",
    material: "leather",
    features: ["rfid blocking", "card slots", "phone holder"]
  },
  {
    id: "4",
    name: "Comfortable Sneakers",
    brand: "WalkEasy",
    category: "shoes",
    subcategory: "sneakers",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Lightweight sneakers perfect for travel",
    tags: ["sneakers", "comfortable", "travel", "lightweight"],
    colors: ["white", "black", "gray"],
    color: "white",
    material: "canvas",
    sizes: ["6", "7", "8", "9", "10", "11"],
    features: ["memory foam", "breathable", "slip-on"]
  },
  {
    id: "5",
    name: "Crossbody Bag",
    brand: "Urban Chic",
    category: "bags",
    subcategory: "crossbody",
    price: 65.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Stylish crossbody bag for hands-free convenience",
    tags: ["crossbody", "stylish", "hands-free", "compact"],
    colors: ["black", "brown", "pink"],
    color: "black",
    material: "leather",
    features: ["adjustable strap", "zipper closure", "inner pockets"]
  },
  {
    id: "6",
    name: "Weekend Tote",
    brand: "Weekend Warriors",
    category: "bags",
    subcategory: "tote",
    price: 95.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Large tote perfect for weekend adventures",
    tags: ["tote", "large", "weekend", "adventure"],
    colors: ["beige", "navy", "olive"],
    color: "beige",
    material: "canvas",
    features: ["reinforced handles", "water resistant", "multiple pockets"]
  },
  {
    id: "7",
    name: "Minimalist Wallet",
    brand: "Simple Life",
    category: "accessories",
    subcategory: "wallet",
    price: 35.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Ultra-slim wallet with phone compatibility",
    tags: ["wallet", "minimalist", "slim", "phone"],
    colors: ["black", "brown", "gray"],
    color: "black",
    material: "leather",
    features: ["ultra-slim", "phone slot", "card holder"]
  },
  {
    id: "8",
    name: "Hiking Backpack",
    brand: "Trail Master",
    category: "bags",
    subcategory: "backpack",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Professional hiking backpack for outdoor adventures",
    tags: ["backpack", "hiking", "outdoor", "professional"],
    colors: ["green", "black", "orange"],
    color: "green",
    material: "nylon",
    features: ["waterproof", "chest strap", "hydration compatible"]
  },
  {
    id: "9",
    name: "Business Tote",
    brand: "Corporate Style",
    category: "bags",
    subcategory: "tote",
    price: 119.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Professional tote for business meetings",
    tags: ["tote", "business", "professional", "meetings"],
    colors: ["black", "navy", "gray"],
    color: "black",
    material: "leather",
    features: ["laptop compartment", "organizer pockets", "leather trim"]
  },
  {
    id: "10",
    name: "Travel Shoes",
    brand: "Globe Trotter",
    category: "shoes",
    subcategory: "sneakers",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop",
    description: "Packable shoes designed for easy travel",
    tags: ["shoes", "travel", "packable", "easy"],
    colors: ["white", "black", "blue"],
    color: "white",
    material: "mesh",
    sizes: ["6", "7", "8", "9", "10", "11"],
    features: ["packable", "quick-dry", "slip-resistant"]
  }
];

export const suggestedQueries: SuggestedQuery[] = [
  {
    id: "1",
    text: "I'm looking for a red bag I can wear everyday",
    category: "bags",
    keywords: ["red", "bag", "everyday", "daily", "wear"]
  },
  {
    id: "2",
    text: "I need a large tote for work and travel",
    category: "bags",
    keywords: ["large", "tote", "work", "travel", "professional"]
  },
  {
    id: "3",
    text: "Show me black leather handbags under $300",
    category: "bags",
    keywords: ["black", "leather", "handbags", "under", "300", "price"]
  },
  {
    id: "4",
    text: "I want a crossbody bag for hands-free convenience",
    category: "bags",
    keywords: ["crossbody", "hands-free", "convenience", "compact"]
  },
  {
    id: "5",
    text: "Find me a backpack for daily use",
    category: "bags",
    keywords: ["backpack", "daily", "use", "everyday"]
  },
  {
    id: "6",
    text: "I need a professional satchel for business meetings",
    category: "bags",
    keywords: ["professional", "satchel", "business", "meetings", "work"]
  }
];
