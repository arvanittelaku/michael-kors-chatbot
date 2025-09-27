import axios from 'axios';
import { Product, TrieveSearchResult } from '../types/shared';

require('dotenv').config({ path: '../../.env' });

export class TrieveService {
  private apiKey: string;
  private datasetId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TRIEVE_API_KEY || '';
    this.datasetId = process.env.TRIEVE_DATASET_ID || '';
    this.baseUrl = 'https://api.trieve.ai/api';

    if (!this.apiKey || !this.datasetId) {
      throw new Error('Trieve API key and dataset ID are required');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'TR-Dataset': this.datasetId
    };
  }

  async searchProducts(query: string, page: number = 1, pageSize: number = 10): Promise<Product[]> {
    try {
      const searchPayload = {
        query: query,
        page: page,
        page_size: pageSize,
        search_type: 'hybrid'
      };

      const response = await axios.post(
        `${this.baseUrl}/chunk/search`,
        searchPayload,
        { headers: this.getHeaders() }
      );

      const result: TrieveSearchResult = response.data;
      
      if (!result.chunks || result.chunks.length === 0) {
        return [];
      }

      // Extract products from chunks
      const products: Product[] = result.chunks.map(chunkData => {
        const chunk = chunkData.chunk;
        return chunk.metadata;
      });

      return products;

    } catch (error) {
      console.error('Trieve search error:', error);
      throw new Error('Failed to search products');
    }
  }

  async searchWithFilters(
    query: string, 
    filters: {
      price?: { min?: number; max?: number };
      color?: string;
      size?: string;
      material?: string;
      brand?: string;
    },
    page: number = 1,
    pageSize: number = 10
  ): Promise<Product[]> {
    try {
      // First, get all matching products
      const allProducts = await this.searchProducts(query, 1, 50);
      
      // Apply filters
      let filteredProducts = allProducts;

      if (filters.price) {
        filteredProducts = filteredProducts.filter(product => {
          if (filters.price!.min && product.price < filters.price!.min) return false;
          if (filters.price!.max && product.price > filters.price!.max) return false;
          return true;
        });
      }

      if (filters.color) {
        const colorLower = filters.color.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.color.toLowerCase().includes(colorLower) ||
          product.colors.some(c => c.toLowerCase().includes(colorLower))
        );
      }

      if (filters.size) {
        const sizeLower = filters.size.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.size.toLowerCase().includes(sizeLower) ||
          product.sizes.some(s => s.toLowerCase().includes(sizeLower))
        );
      }

      if (filters.material) {
        const materialLower = filters.material.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.material.toLowerCase().includes(materialLower)
        );
      }

      if (filters.brand) {
        const brandLower = filters.brand.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.brand.toLowerCase().includes(brandLower)
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return filteredProducts.slice(startIndex, endIndex);

    } catch (error) {
      console.error('Trieve filtered search error:', error);
      throw new Error('Failed to search products with filters');
    }
  }

  async getProductById(trackingId: string): Promise<Product | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/chunk/tracking_id/${trackingId}`,
        { headers: this.getHeaders() }
      );

      if (response.data && response.data.metadata) {
        return response.data.metadata;
      }

      return null;

    } catch (error) {
      console.error('Trieve get product error:', error);
      return null;
    }
  }

  async getSimilarProducts(productId: string, limit: number = 5): Promise<Product[]> {
    try {
      // Get the product first
      const product = await this.getProductById(productId);
      if (!product) return [];

      // Search for similar products using category and brand
      const similarQuery = `${product.category} ${product.brand} ${product.subcategory}`;
      const similarProducts = await this.searchProducts(similarQuery, 1, limit + 1);

      // Filter out the original product
      return similarProducts.filter(p => p.id !== product.id).slice(0, limit);

    } catch (error) {
      console.error('Trieve similar products error:', error);
      return [];
    }
  }
}

