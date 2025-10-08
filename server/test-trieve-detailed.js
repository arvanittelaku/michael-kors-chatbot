const axios = require('axios');

async function testTrieveDetailed() {
  console.log('🔍 Testing Trieve API with detailed diagnostics...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  console.log('📋 Configuration:');
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`Dataset ID: ${DATASET_ID}`);
  console.log(`Organization ID: ${ORG_ID}`);
  console.log('');
  
  const BASE_URL = 'https://api.trieve.ai/api/v1';
  
  // Test 1: Check organizations endpoint
  console.log('1️⃣ Testing organizations endpoint...');
  try {
    const orgResponse = await axios.get(`${BASE_URL}/organization`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Organizations accessible:', orgResponse.status);
    console.log('📊 Organizations data:', JSON.stringify(orgResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Organizations error:', error.response?.status, error.response?.data);
  }
  
  // Test 2: Check datasets endpoint with organization header
  console.log('\n2️⃣ Testing datasets endpoint...');
  try {
    const datasetsResponse = await axios.get(`${BASE_URL}/dataset`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'TR-Organization': ORG_ID,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Datasets accessible:', datasetsResponse.status);
    console.log('📊 Datasets data:', JSON.stringify(datasetsResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Datasets error:', error.response?.status, error.response?.data);
  }
  
  // Test 3: Direct chunk search with detailed headers
  console.log('\n3️⃣ Testing chunk search...');
  try {
    const searchPayload = {
      query: 'fashion',
      dataset_id: DATASET_ID,
      limit: 3,
      search_type: 'hybrid'
    };
    
    console.log('📤 Payload:', JSON.stringify(searchPayload, null, 2));
    
    const searchResponse = await axios.post(`${BASE_URL}/chunk/search`, searchPayload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'TR-Dataset': DATASET_ID,
        'TR-Organization': ORG_ID,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ Search successful:', searchResponse.status);
    console.log('📊 Search results:', JSON.stringify(searchResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Search error:', error.response?.status, error.response?.data);
    if (error.response?.status === 403) {
      console.log('\n🔧 403 Troubleshooting:');
      console.log('- API key might not have access to this dataset');
      console.log('- Dataset might be private and require explicit access');
      console.log('- Organization ID format might be incorrect');
      console.log('- API key might have expired or been regenerated');
    }
  }
  
  // Test 4: Alternative endpoint formats
  console.log('\n4️⃣ Testing alternative endpoints...');
  
  const alternatives = [
    '/search',
    '/chunk',
    '/chunks',
    '/query',
    `/${ORG_ID}/dataset/${DATASET_ID}/search`
  ];
  
  for (const endpoint of alternatives) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const altResponse = await axios.post(`${BASE_URL}${endpoint}`, {
        query: 'test',
        dataset_id: DATASET_ID,
        limit: 1
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'TR-Dataset': DATASET_ID,
          'TR-Organization': ORG_ID,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log(`✅ ${endpoint} worked:`, altResponse.status);
    } catch (error) {
      console.log(`❌ ${endpoint} failed:`, error.response?.status || error.message);
    }
  }
}

testTrieveDetailed().catch(console.error);
