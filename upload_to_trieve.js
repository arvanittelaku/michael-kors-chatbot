const axios = require('axios');
const fs = require('fs');

// Trieve Configuration
const TRIEVE_CONFIG = {
  apiKey: 'tr-HTv41SQt3FTCBEsIU6vT43X3xj8Qaolg',
  datasetId: 'da45df92-5f1e-45f3-94b0-e0c5a6562043',
  organizationId: '013878ea-2998-4fed-ac8e-1c4f10bcbd44',
  baseUrl: 'https://api.trieve.ai'
};

async function uploadProductsToTrieve() {
  console.log('🚀 Starting product upload to Trieve dataset...\n');
  
  try {
    // Load products from JSON file
    console.log('📦 Loading products from michael_kors_products_300.json...');
    const productsData = fs.readFileSync('michael_kors_products_300.json', 'utf8');
    const products = JSON.parse(productsData);
    console.log(`✅ Loaded ${products.length} products\n`);
    
    // Prepare chunks for Trieve
    console.log('🔄 Preparing chunks for Trieve...');
    const chunks = products.map(product => ({
      chunk_html: generateProductHTML(product),
      content: generateProductContent(product),
      link: `https://michaelkors.com/products/${product.id}`,
      metadata: product,
      time_stamp: new Date().toISOString(),
      tracking_id: product.id
    }));
    
    console.log(`✅ Prepared ${chunks.length} chunks\n`);
    
    // Upload in batches (Trieve has limits)
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < chunks.length; i += batchSize) {
      batches.push(chunks.slice(i, i + batchSize));
    }
    
    console.log(`📤 Uploading ${batches.length} batches to Trieve...`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`   Uploading batch ${i + 1}/${batches.length} (${batch.length} products)...`);
      
      try {
        const response = await axios.post(
          `${TRIEVE_CONFIG.baseUrl}/api/chunk`,
          {
            chunks: batch,
            dataset_id: TRIEVE_CONFIG.datasetId
          },
          {
            headers: {
              'Authorization': `Bearer ${TRIEVE_CONFIG.apiKey}`,
              'Content-Type': 'application/json',
              'TR-Organization': TRIEVE_CONFIG.organizationId
            }
          }
        );
        
        console.log(`   ✅ Batch ${i + 1} uploaded successfully`);
        
        // Small delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`   ❌ Error uploading batch ${i + 1}:`, error.response?.data || error.message);
        throw error;
      }
    }
    
    console.log(`\n🎉 Successfully uploaded all ${products.length} products to Trieve dataset!`);
    console.log(`📊 Dataset ID: ${TRIEVE_CONFIG.datasetId}`);
    
    // Test the upload by searching
    console.log('\n🔍 Testing search functionality...');
    await testSearch();
    
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

function generateProductHTML(product) {
  return `
    <div class="product-card">
      <h2>${product.name}</h2>
      <p><strong>Brand:</strong> ${product.brand}</p>
      <p><strong>Category:</strong> ${product.category} - ${product.subcategory}</p>
      <p><strong>Price:</strong> $${product.price}</p>
      <p><strong>Color:</strong> ${product.color}</p>
      <p><strong>Available Colors:</strong> ${product.colors.join(', ')}</p>
      <p><strong>Size:</strong> ${product.size}</p>
      <p><strong>Available Sizes:</strong> ${product.sizes.join(', ')}</p>
      <p><strong>Material:</strong> ${product.material}</p>
      <p><strong>Description:</strong> ${product.description}</p>
      <p><strong>Features:</strong> ${product.features.join(', ')}</p>
      <p><strong>Collection:</strong> ${product.collection}</p>
      <p><strong>Season:</strong> ${product.season}</p>
      <p><strong>Rating:</strong> ${product.rating}/5 (${product.reviews_count} reviews)</p>
      <p><strong>Availability:</strong> ${product.availability}</p>
      <p><strong>Dimensions:</strong> ${product.dimensions}</p>
      <p><strong>Weight:</strong> ${product.weight}</p>
      <p><strong>Care Instructions:</strong> ${product.care_instructions}</p>
      <p><strong>Warranty:</strong> ${product.warranty}</p>
      <p><strong>Tags:</strong> ${product.tags.join(', ')}</p>
    </div>
  `;
}

function generateProductContent(product) {
  return `
    ${product.name} ${product.brand} ${product.category} ${product.subcategory} 
    ${product.color} ${product.colors.join(' ')} ${product.size} ${product.sizes.join(' ')} 
    ${product.material} ${product.description} ${product.features.join(' ')} 
    ${product.collection} ${product.season} ${product.tags.join(' ')}
    Price: $${product.price} Rating: ${product.rating} Reviews: ${product.reviews_count}
    ${product.availability} ${product.dimensions} ${product.weight}
    ${product.care_instructions} ${product.warranty}
  `.replace(/\s+/g, ' ').trim();
}

async function testSearch() {
  try {
    const response = await axios.post(
      `${TRIEVE_CONFIG.baseUrl}/api/chunk/search`,
      {
        query: 'red bag everyday',
        dataset_id: TRIEVE_CONFIG.datasetId,
        limit: 3,
        search_type: "hybrid"
      },
      {
        headers: {
          'Authorization': `Bearer ${TRIEVE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'TR-Organization': TRIEVE_CONFIG.organizationId
        }
      }
    );
    
    const results = response.data.score_chunks;
    console.log(`✅ Search test successful! Found ${results.length} results`);
    
    if (results.length > 0) {
      console.log('   Sample result:');
      console.log(`   - Product: ${results[0].chunk.metadata.name}`);
      console.log(`   - Color: ${results[0].chunk.metadata.color}`);
      console.log(`   - Price: $${results[0].chunk.metadata.price}`);
    }
    
  } catch (error) {
    console.error('❌ Search test failed:', error.response?.data || error.message);
  }
}

// Run the upload
uploadProductsToTrieve();
