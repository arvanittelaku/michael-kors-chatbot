const axios = require('axios');

async function testFinalTrieve() {
  console.log('🔍 Final test with corrected endpoint...');
  
  const payload = {
    query: 'shirt',
    dataset_id: 'd07948bc-576d-403c-9ca8-4b264b006aa1',
    limit: 5,
    search_type: 'hybrid'
  };
  
  const headers = {
    'Authorization': 'Bearer tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU',
    'TR-Dataset': 'd07948bc-576d-403c-9ca8-4b264b006aa1',
    'TR-Organization': '013878ea-2998-4fed-ac8e-1c4f10bcbd44',
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await axios.post('https://api.trieve.ai/api/chunk/search', payload, { headers, timeout: 10000 });
    
    console.log(`✅ SUCCESS! Status: ${response.status}`);
    console.log(`Found ${response.data.chunks.length} chunks`);
    
    // Test product mapping
    const products = [];
    response.data.chunks.forEach((item, i) => {
      const chunk = item.chunk;
      const meta = chunk.metadata;
      
      if (meta.name && typeof meta.price === 'number') {
        products.push({
          id: meta.tracking_id || chunk.id,
          name: meta.name,
          price: meta.price,
          color: meta.color || 'Unknown',
          size: meta.size || 'One Size',
          material: meta.material || 'Mixed'
        });
      }
    });
    
    console.log(`✅ Mapped ${products.length} valid products`);
    console.log('\nSample products:');
    products.slice(0, 3).forEach((p, i) => {
      console.log(`${i+1}. ${p.name} - $${p.price} (${p.color}, ${p.material})`);
    });
    
    console.log('\n🎉 READY TO USE! The TrieveService is now configured correctly.');
    return true;
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

testFinalTrieve();
