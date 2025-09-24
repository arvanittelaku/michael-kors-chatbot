export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  image: string;
  image_url?: string;
  description: string;
  tags: string[];
  colors: string[];
  sizes?: string[];
  features: string[];
}

export interface SuggestedQuery {
  id: string;
  text: string;
  category: string;
  keywords: string[];
}
