/**
 * Direct API test with detailed response logging
 */

const axios = require('axios');

async function test() {
  const API_URL = 'https://michael-kors-chatbot.onrender.com/chat';
  const sessionId = `debug_${Date.now()}`;
  
  console.log('Test 1: Just "silver" as a single word\n');
  
  const r = await axios.post(API_URL, {
    userId: sessionId,
    message: 'silver'
  });
  
  console.log('Full response:', JSON.stringify(r.data, null, 2));
}

test().catch(e => console.error('Error:', e.message));

