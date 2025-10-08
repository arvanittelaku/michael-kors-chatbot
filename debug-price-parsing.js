const axios = require('axios');

async function debugPriceParsing() {
  console.log('🔍 DEBUGGING PRICE PARSING');
  console.log('==========================');
  
  try {
    // Test with detailed logging
    const response = await axios.post('http://localhost:5000/chat', {
      userId: 'debug_test',
      message: 'Kërkoj xhinse'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('Step 1: Jeans context established');
    
    // Now test price parsing
    const response2 = await axios.post('http://localhost:5000/chat', {
      userId: 'debug_test',
      message: 'nën 20$'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('Step 2: Price filter test');
    console.log('Response message:', response2.data.message);
    
    // Let me also test the exact parsing
    console.log('\nTesting different price formats:');
    
    const testCases = ['nën 20$', 'nen 20$', 'under 20$', 'rreth 20$'];
    
    for (const testCase of testCases) {
      const response = await axios.post('http://localhost:5000/chat', {
        userId: `test_${testCase.replace(/\s+/g, '_')}`,
        message: testCase
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      console.log(`"${testCase}" → Message: ${response.data.message.substring(0, 100)}...`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

debugPriceParsing();
