// Test the exact same product parsing logic as the server
const axios = require('axios');

async function debugServerProductParsing() {
  console.log('🔍 Debug server product parsing logic...');
  
  // Make the exact same Trieve request as server
  const payload = {
    query: 'shirt kemishe',
    dataset_id: 'd07948bc-576d-403c-9ca8-4b264b006aa1',
    limit: 10,
    search_type: "hybrid"
  };
  
  const headers = {
    "Authorization": "Bearer tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU",
    "TR-Dataset": "d07948bc-576d-403c-9ca8-4b264b006aa1",
    "TR-Organization": "013878ea-2998-4fed-ac8e-1c4f10bcbd44",
    "Content-Type": "application/json"
  };
  
  try {
    const response = await axios.post('https://api.trieve.ai/api/chunk/search', payload, { headers, timeout: 10000 });
    console.log(`✅ Got ${response.data.chunks.length} chunks from Trieve`);
    
    const products = [];
    const filters = { category: 'shirt' };
    
    // Apply same logic as server
    response.data.chunks.forEach((chunkItem, i) => {
      const chunk = chunkItem.chunk;
      console.log(`\n--- Chunk ${i + 1} ---`);
      console.log('Chunk ID:', chunk.id);
      console.log('Metadata:', chunk.metadata ? Object.keys(chunk.metadata) : 'No metadata');
      
      if (chunk && chunk.metadata) {
        const metadata = chunk.metadata;
        console.log('Name:', metadata.name || 'UNDEFINED');
        console.log('Price:', metadata.price, 'Type:', typeof metadata.price);
        console.log('Color:', metadata.color || 'UNDEFINED');
        console.log('Size:', metadata.size || 'UNDEFINED');
        console.log('Material:', metadata.material || 'UNDEFINED');
        
        // Same validation logic as server
        const productName = metadata.name || metadata.description || chunk.chunk_html?.split('\n')[1] || `Product ${chunk.id.slice(0,8)}`;
        const productPrice = typeof metadata.price === 'number' ? metadata.price : 
                           metadata.original_price || 
                           parseInt((metadata.price || '').toString()) || 
                           Math.floor(Math.random() * 50) + 10;
        
        console.log('Parsed Name:', productName);
        console.log('Parsed Price:', productPrice);
        
        if (productName && productPrice > 0) {
          const product = {
            id: metadata.tracking_id || metadata.product_no || chunk.id || `product_${products.length}`,
            name: productName,
            price: productPrice,
            color: metadata.color || 'Mixed',
            size: metadata.size || 'One Size',
            material: metadata.material || 'Mixed'
          };
          
          console.log('Created Product:', product);
          
          // Test filtering logic
          const productName_lower = product.name.toLowerCase();
          const categoryKeywords = {
            'shirt': ['kemishë', 'këmishë', 'shirt', 'bluze', 'bluzë']
          };
          const keywords = categoryKeywords['shirt'] || ['shirt'];
          const matchesCategory = keywords.some(keyword => productName_lower.includes(keyword));
          
          console.log('Matches category criteria:', matchesCategory);
          
          if (!matchesCategory) {
            const isRealBrand = productName_lower.includes('boss') || productName_lower.includes('brand') || 
                               productName_lower.length > 5;
            console.log('Is real brand (bypass):', isRealBrand);
            if (!isRealBrand) {
              console.log('❌ PRODUCT REJECTED by filter');
              return;
            }
          }
          
          console.log('✅ PRODUCT ACCEPTED');
          products.push(product);
        } else {
          console.log('❌ REJECTED - No valid name/price');
        }
      }
    });
    
    console.log(`\n🎯 FINAL RESULT: ${products.length} valid products`);
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - $${p.price} (${p.color}, ${p.size}, ${p.material})`);
    });
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.message);
  }
}

debugServerProductParsing();
