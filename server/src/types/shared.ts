export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  color: string;
  colors: string[];
  size: string;
  sizes: string[];
  material: string;
  description: string;
  image: string;
  images: string[];
  features: string[];
  tags: string[];
  availability: string;
  rating: string;
  reviews_count: number;
  country_of_origin: string;
  cross_reference: string;
  product_no: string;
  color_hex: string;
  season_year: string;
  gender: string;
  age_class: string;
  season: string;
}

export interface TrieveChunk {
  id: string;
  chunk_html: string;
  tracking_id: string;
  metadata: Product;
  time_stamp: string;
  dataset_id: string;
  weight: number;
}

export interface TrieveSearchResult {
  id: string;
  chunks: Array<{
    chunk: TrieveChunk;
    highlights?: string[];
    score: number;
  }>;
  corrected_query?: string;
  total_pages?: number;
}

export interface ChatbotResponse {
  assistant_text: string;
  recommended_products: Array<{
    id: string;
    title: string;
    highlight: string[];
    image?: string;
  }>;
  audit_notes?: string;
}

export interface SessionContext {
  lastQuery?: string;
  lastProducts?: Product[];
  lastCategory?: string;
  lastFilters?: {
    price?: { min?: number; max?: number };
    color?: string;
    size?: string;
    material?: string;
    brand?: string;
  };
  conversationHistory: Array<{
    user: string;
    assistant: string;
    timestamp: Date;
  }>;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  data: ChatbotResponse;
  sessionId: string;
}
