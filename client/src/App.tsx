import React, { useState, useEffect } from 'react';
import { Search, Camera, Send, X } from 'lucide-react';
import ProductGrid from './components/ProductGrid';
import SuggestedQueries from './components/SuggestedQueries';
import SearchBar from './components/SearchBar';
import ChatResponse from './components/ChatResponse';
import { Product, SuggestedQuery } from './types';

interface SearchResult {
  message: string;
  products: Product[];
  query: string;
  timestamp: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestedQueries, setSuggestedQueries] = useState<SuggestedQuery[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchSuggestedQueries();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuggestedQueries = async () => {
    try {
      const response = await fetch('/api/suggested-queries');
      const data = await response.json();
      setSuggestedQueries(data);
    } catch (error) {
      console.error('Error fetching suggested queries:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchQuery(query);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQueryClick = (query: SuggestedQuery) => {
    handleSearch(query.text);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  const displayProducts = searchResults ? searchResults.products : products;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Michael Kors Style Assistant</h1>
            </div>
            <button 
              onClick={handleClearSearch}
              className="w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Ask me anything"
          />
        </div>

        {/* Suggested Queries */}
        <div className="mb-8">
          <SuggestedQueries 
            queries={suggestedQueries}
            onQueryClick={handleSuggestedQueryClick}
          />
        </div>

        {/* Chat Response */}
        {searchResults && (
          <div className="mb-8">
            <ChatResponse 
              response={searchResults.message}
              query={searchResults.query}
            />
          </div>
        )}

        {/* Product Grid */}
        <ProductGrid 
          products={displayProducts}
          isLoading={isLoading}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            By submitting a search via the virtual style assistant, you agree to the information being processed according to our Terms & Conditions and Privacy Notice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
