import { Request, Response, NextFunction } from 'express';

// Input sanitization function
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 500); // Limit length
};

// Validation middleware for search queries
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Query is required and must be a string',
      code: 'INVALID_QUERY_TYPE'
    });
  }
  
  const sanitizedQuery = sanitizeInput(query);
  
  if (sanitizedQuery.length === 0) {
    return res.status(400).json({ 
      error: 'Query cannot be empty after sanitization',
      code: 'EMPTY_QUERY'
    });
  }
  
  if (sanitizedQuery.length < 2) {
    return res.status(400).json({ 
      error: 'Query must be at least 2 characters long',
      code: 'QUERY_TOO_SHORT'
    });
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /function\s*\(/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(query))) {
    return res.status(400).json({ 
      error: 'Query contains invalid characters',
      code: 'SUSPICIOUS_INPUT'
    });
  }
  
  // Replace the original query with sanitized version
  req.body.query = sanitizedQuery;
  next();
};

// Validation middleware for product arrays
export const validateProductArray = (req: Request, res: Response, next: NextFunction) => {
  const { products } = req.body;
  
  if (!Array.isArray(products)) {
    return res.status(400).json({ 
      error: 'Products must be an array',
      code: 'INVALID_PRODUCTS_TYPE'
    });
  }
  
  if (products.length === 0) {
    return res.status(400).json({ 
      error: 'Products array cannot be empty',
      code: 'EMPTY_PRODUCTS'
    });
  }
  
  if (products.length > 10) {
    return res.status(400).json({ 
      error: 'Too many products. Maximum 10 allowed.',
      code: 'TOO_MANY_PRODUCTS'
    });
  }
  
  // Validate each product has required fields
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (!product.id || typeof product.id !== 'string') {
      return res.status(400).json({ 
        error: `Product at index ${i} must have a valid id`,
        code: 'INVALID_PRODUCT_ID'
      });
    }
    
    if (!product.name || typeof product.name !== 'string') {
      return res.status(400).json({ 
        error: `Product at index ${i} must have a valid name`,
        code: 'INVALID_PRODUCT_NAME'
      });
    }
    
    if (typeof product.price !== 'number' || product.price < 0) {
      return res.status(400).json({ 
        error: `Product at index ${i} must have a valid price`,
        code: 'INVALID_PRODUCT_PRICE'
      });
    }
  }
  
  next();
};

// Validation middleware for category suggestions
export const validateCategory = (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.body;
  
  if (category && typeof category !== 'string') {
    return res.status(400).json({ 
      error: 'Category must be a string',
      code: 'INVALID_CATEGORY_TYPE'
    });
  }
  
  if (category) {
    const sanitizedCategory = sanitizeInput(category);
    req.body.category = sanitizedCategory;
  }
  
  next();
};

// Validation middleware for product IDs
export const validateProductIds = (req: Request, res: Response, next: NextFunction) => {
  const { productIds } = req.body;
  
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ 
      error: 'Product IDs must be an array',
      code: 'INVALID_PRODUCT_IDS_TYPE'
    });
  }
  
  if (productIds.length === 0) {
    return res.status(400).json({ 
      error: 'Product IDs array cannot be empty',
      code: 'EMPTY_PRODUCT_IDS'
    });
  }
  
  if (productIds.length > 5) {
    return res.status(400).json({ 
      error: 'Too many product IDs. Maximum 5 allowed.',
      code: 'TOO_MANY_PRODUCT_IDS'
    });
  }
  
  // Validate each ID is a string
  for (let i = 0; i < productIds.length; i++) {
    if (typeof productIds[i] !== 'string' || productIds[i].trim().length === 0) {
      return res.status(400).json({ 
        error: `Product ID at index ${i} must be a non-empty string`,
        code: 'INVALID_PRODUCT_ID_FORMAT'
      });
    }
  }
  
  next();
};

// General request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Basic request validation - can be extended as needed
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      error: 'Request body must be a valid JSON object',
      code: 'INVALID_REQUEST_BODY'
    });
  }
  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Server Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong. Please try again.',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
};

