/**
 * Test if "ngjyre silver" is being parsed correctly
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com/debug';

async function testParsing() {
  try {
    const response = await axios.post(API_URL, {
      message: 'ngjyre silver nen 30'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log('Parsed filters:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Debug endpoint not available or error:', error.message);
    console.log('\nLet me test by searching for pantallona with silver filter...\n');
    
    // Alternative: test through chat
    const sessionId = `test_parse_${Date.now()}`;
    
    // First: establish pants context
    console.log('Query 1: "pantallona"');
    const r1 = await axios.post('https://michael-kors-chatbot.onrender.com/chat', {
      userId: sessionId,
      message: 'pantallona'
    });
    console.log(`Products: ${r1.data.products.length}`);
    console.log(`Session filters:`, r1.data.sessionContext.appliedFilters);
    
    // Second: add silver filter
    console.log('\nQuery 2: "ngjyre silver"');
    const r2 = await axios.post('https://michael-kors-chatbot.onrender.com/chat', {
      userId: sessionId,
      message: 'ngjyre silver'
    });
    console.log(`Products: ${r2.data.products.length}`);
    console.log(`Session filters:`, r2.data.sessionContext.appliedFilters);
    console.log(`Colors in results:`, [...new Set(r2.data.products.map(p => p.color))]);
  }
}

testParsing().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

