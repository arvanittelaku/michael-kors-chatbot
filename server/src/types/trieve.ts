// Re-export shared types and extend for Trieve-specific needs
import { Product } from './shared';

// Extended ProductDocument type for Trieve (without required image field)
export interface ProductDocument extends Omit<Product, 'image'> {
  image?: string; // Make image optional for Trieve products
}

// Trieve-specific interfaces

// Trieve-specific interfaces
export interface TrieveSearchResult {
  score_chunks: Array<{
    chunk: {
      chunk_html: string;
      content: string;
      id: string;
      link: string;
      metadata: Product;
      time_stamp: string;
      tracking_id: string;
    };
    score: number;
  }>;
}

export interface TrieveChunk {
  chunk_html: string;
  content: string;
  link: string;
  metadata: Product;
  time_stamp: string;
  tracking_id: string;
}
