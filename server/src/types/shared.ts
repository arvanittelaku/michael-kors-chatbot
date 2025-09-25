// Shared type definitions for the entire application
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image: string;
  image_url?: string;
  description: string;
  tags: string[];
  colors: string[];
  color: string;
  sizes?: string[];
  size?: string;
  material: string;
  features: string[];
  availability?: string;
  rating?: number;
  reviews_count?: number;
  collection?: string;
  season?: string;
  care_instructions?: string;
  dimensions?: string;
  weight?: string;
  warranty?: string;
  style_code?: string;
  tracking_id?: string;
}

export interface SuggestedQuery {
  id: string;
  text: string;
  category: string;
  keywords: string[];
}

export interface ChatbotResponse {
  message: string;
  products: Product[];
  query: string;
  timestamp?: string;
}

export interface SearchResult {
  message: string;
  products: Product[];
  query: string;
  timestamp: string;
}

export interface AIRequest {
  query: string;
  products: Product[];
}

export interface APIError {
  error: string;
  message?: string;
  timestamp?: string;
  retryAfter?: number;
}

// Configuration interfaces
export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  frontendUrl?: string;
  backendUrl?: string;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface TrieveConfig {
  apiKey: string;
  datasetId: string;
  organizationId: string;
  baseUrl: string;
}

// Rate limiting
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

