/**
 * Debug size filtering to see what's happening
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';

async function sendMessage(message, sessionId) {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId: sessionId,
      message: message
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    return {
      success: true,
      message: response.data.message,
      products: response.data.products || [],
      sessionContext: response.data.sessionContext
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function debugTest() {
  console.log('Testing size filtering with explicit category...\n');
  
  const sessionId = `debug_size_${Date.now()}`;
  
  // Test with EXPLICIT category mention
  console.log('Test 1: "dua nje fustan te madhsise 50" (explicit category)');
  const r1 = await sendMessage('dua nje fustan te madhsise 50', sessionId);
  console.log(`Response: ${r1.message || 'NO RESPONSE'}`);
  console.log(`Products: ${r1.products?.length || 0}`);
  console.log(`Session filters: ${JSON.stringify(r1.sessionContext?.appliedFilters || {})}\n`);
  
  // Test with session context
  console.log('Test 2: First establish context with "qfar brende te fustanave keni"');
  const sessionId2 = `debug_size2_${Date.now()}`;
  const r2 = await sendMessage('qfar brende te fustanave keni', sessionId2);
  console.log(`Response: ${r2.message.substring(0, 60)}...`);
  console.log(`Products: ${r2.products.length}`);
  console.log(`Session filters: ${JSON.stringify(r2.sessionContext?.appliedFilters)}`);
  console.log(`Session lastCategory: ${r2.sessionContext?.lastCategory}\n`);
  
  console.log('Test 3: Then "dua nje te madhsise 50" (should use session context)');
  const r3 = await sendMessage('dua nje te madhsise 50', sessionId2);
  console.log(`Response: ${r3.message}`);
  console.log(`Products: ${r3.products.length}`);
  console.log(`Session filters: ${JSON.stringify(r3.sessionContext?.appliedFilters)}`);
  console.log(`Session lastCategory: ${r3.sessionContext?.lastCategory}\n`);
  
  // Test with XL
  console.log('Test 4: "dua nje fustan te madhsise xl" (explicit category)');
  const r4 = await sendMessage('dua nje fustan te madhsise xl', sessionId);
  console.log(`Response: ${r4.message}`);
  console.log(`Products: ${r4.products.length}\n`);
}

debugTest().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

