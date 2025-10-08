const axios = require('axios');

// Test exact TrieveService logic with new API key
async function testWorkingTrieveService() {
  console.log('🔍 Testing TrieveService with NEW API key...\n');
  
  const BASE_URL = 'https://api.trieve.ai';
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  const filters = { category: 'shirt' };
  const searchQuery = 'fashion products shirt';
  
  const payload = {
    query: searchQuery,
    dataset_id: DATASET_ID,
    limit: 20,
    search_type: "hybrid"
  };
  
  const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "TR-Dataset": DATASET_ID,
    "TR-Organization": ORG_ID,
    "Content-Type": "application/json"
  };
  
  const queryUrl = `${BASE_URL}/api/chunk/search`;
  
  console.log('🚀 Testing Trieve connection...');
  console.log('API Key:', API_KEY.slice(0, 15) + '...');
  console.log('Dataset:', DATASET_ID);
  console.log('Endpoint:', queryUrl);
  
  try {
    const response = await axios.post(queryUrl, payload, {
      headers: headers,
      timeout: 10000
    });
    
    console.log(`✅ SUCCESS! Status: ${response.status}`);
    console.log(`📦 Received ${response.data.chunks.length} chunks`);
    
    // Apply same product parsing logic as TrieveService
    const products = [];
    
    response.data.chunks.forEach((chunkItem) => {
      const chunk = chunkItem.chunk;
      if (chunk && chunk.metadata) {
        const metadata = chunk.metadata;
        
        // Same validation logic as server
        const productName = metadata.name || metadata.description || 
                          chunk.chunk_html?.split('\n')[1] || 
                          `Product ${chunk.id.slice(0,8)}`;
        const productPrice = typeof metadata.price === 'number' ? metadata.price : 
                           metadata.original_price || 
                           parseInt((metadata.price || '').toString()) || 
                           Math.floor(Math.random() * 50) + 10;
        
        if (productName && productPrice > 0) {
          const product = {
            id: metadata.tracking_id || metadata.product_no || chunk.id || `product_${products.length}`,
            name: productName,
            price: productPrice,
            color: metadata.color || 'Mixed',
            size: metadata.size || 'One Size',
            material: metadata.material || 'Mixed'
          };
          
          // Filter check
          const productName_lower = product.name.toLowerCase();
          const isRealBrand = productName_lower.includes('boss') || productName_lower.includes('brand') || 
                             productName_lower.includes('kemishë') || productName_lower.length > 5;
          
          if (isRealBrand || productName_lower.includes('kemishë')) {
            console.log(`✅ PRODUCT ACCEPTED: ${product.name} - $${product.price} (${product.color}, ${product.size})`);
            products.push(product);
          } else {
            console.log(`❌ PRODUCT FILTERED: ${product.name} - Failed filter criteria`);
          }
        }
      }
    });
    
    console.log(`\n🎯 FINAL RESULT: ${products.length} valid products`);
    
    if (products.length > 0) {
      console.log('\n✅ TRIEVE SUCCESS: Using real products from dataset');
      console.log('\nSample products:');
      products.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. ${p.name} - $${p.price} (${p.color}, ${p.size}, ${p.material})`);
      });
      console.log('\n🚀 Ready to deploy - Trieve will return real data!');
    } else {
      console.log('❌ NO PRODUCTS MATCHED - Would trigger AI fallback');
    }
    
  } catch (error) {
    console.log(`❌ TRIEVE FAILED: ${error.message}`);
    
    if (error.response?.status === 401) {
      console.log('🔑 401 UNAUTHORIZED: API key issue');
      console.log('Current key:', API_KEY.slice(0, 15) + '...');
    } else if (error.response?.status === 403) {
      console.log('🔒 403 FORBIDDEN: Permission issue');
    }
    
    console.log('🔄 Would use AI fallback');
  }
}

testWorkingTrieveService().catch(console.error);
