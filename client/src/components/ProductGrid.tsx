import React from 'react';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow group">
          <div className="aspect-square relative overflow-hidden">
            <img
              src={product.image_url || product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=No+Image';
              }}
            />
            <div className="absolute bottom-2 right-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs font-semibold text-gray-600">CO</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                ${product.price}
              </span>
              <div className="flex space-x-1">
                {product.colors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: getColorValue(color) }}
                    title={color}
                  />
                ))}
                {product.colors.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to convert color names to hex values
function getColorValue(color: string): string {
  const colorMap: { [key: string]: string } = {
    black: '#000000',
    white: '#FFFFFF',
    brown: '#8B4513',
    tan: '#D2B48C',
    navy: '#000080',
    gray: '#808080',
    pink: '#FFC0CB',
    blue: '#0000FF',
    green: '#008000',
    orange: '#FFA500',
    olive: '#808000',
    beige: '#F5F5DC'
  };
  return colorMap[color.toLowerCase()] || '#CCCCCC';
}

export default ProductGrid;
