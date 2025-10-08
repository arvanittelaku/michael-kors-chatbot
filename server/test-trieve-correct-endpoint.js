const axios = require('axios');

async function testTrieveCorrectEndpoint() {
  console.log('🔍 Testing Trieve with correct endpoint format...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  // Correct endpoint format
  const correctUrl = `https://api.trieve.ai/v1/datasets/${DATASET_ID}/query`;
  
  const payload = {
    query: 'peshqir',
    limit: 5,
    search_type: 'hybrid'
  };
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'OpenAI-Organization': ORG_ID,
    'Content-Type': 'application/json'
  };
  
  console.log('📋 Configuration:');
  console.log(`URL: ${correctUrl}`);
  console.log(`Payload:`, JSON.stringify(payload, null, 2));
  console.log(`Headers:`, JSON.stringify(headers, null, 2));
  console.log('');
  
  try {
    console.log('🚀 Sending request to correct endpoint...');
    
    const response = await axios.post(correctUrl, payload, {
      headers: headers,
      timeout: 15000
    });
    
    console.log('✅ SUCCESS! Response received:');
    console.log(`Status: ${response.status}`);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
    // Check if we have chunks/products
    if (response.data && response.data.length > 0) {
      console.log('\n🎉 Real dataset products found!');
      response.data.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${JSON.stringify(product, null, 2)}`);
      });
    } else {
      console.log('\n⚠️ No products in response data structure');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // If still 403, check what might be wrong
    if (error.response?.status === 403) {
      console.log('\n🔧 403 Troubleshooting:');
      console.log('- Verify API key has access to this dataset');
      console.log('- Check if organization ID is correct for this API key');
      console.log('- Ensure dataset is public or API key has permissions');
      console.log('- Try a different endpoint format if needed');
    }
  }
}

testTrieveCorrectEndpoint().catch(console.error);
