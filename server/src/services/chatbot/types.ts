export interface SessionContext {
  userId: string;
  lastProducts?: Product[];
  appliedFilters?: ParsedFilters;
  lastCategory?: string;
  firstMessage?: boolean;
  messageHistory: string[];
  timestamp: number;
}

export interface Filters {
  category?: string;
  color?: string;
  price?: {
    min?: number;
    max?: number;
    exact?: number;
  };
  size?: string[];
  material?: string;
  brand?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  color: string;
  size: string;
  material: string;
  brand?: string;
  _source?: string; // Add _source for provenance tracking
  tracking_id?: string;
  categories?: string[];
  images?: string[];
}

export interface ChatRequest {
  userId: string;
  message: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  products: Product[];
  sessionContext?: SessionContext;
}

export type FollowUpType = 'SUGGESTION' | 'FILTER_UPDATE' | 'CONTINUATION' | 'NEW_QUERY';

export interface ParsedFilters {
  category?: string;
  color?: string;
  price?: {
    min?: number;
    max?: number;
    exact?: number;
  };
  size?: string[];
  material?: string;
  _offset?: number; // For pagination support
}
