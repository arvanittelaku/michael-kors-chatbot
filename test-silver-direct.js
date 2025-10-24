/**
 * Direct test of the exact user scenario
 */

const axios = require('axios');

async function test() {
  const API_URL = 'https://michael-kors-chatbot.onrender.com/chat';
  const sessionId = `test_${Date.now()}`;
  
  // Exact user scenario
  console.log('Scenario: Establish pants, then silver + under 30\n');
  
  console.log('1. "a keni pantallona"');
  const r1 = await axios.post(API_URL, {
    userId: sessionId,
    message: 'a keni pantallona'
  });
  console.log(`   Products: ${r1.data.products.length}`);
  console.log(`   Filters: ${JSON.stringify(r1.data.sessionContext.appliedFilters)}\n`);
  
  console.log('2. "ngjyre silver nen 30"');
  const r2 = await axios.post(API_URL, {
    userId: sessionId,
    message: 'ngjyre silver nen 30'
  });
  console.log(`   Products: ${r2.data.products.length}`);
  console.log(`   Filters: ${JSON.stringify(r2.data.sessionContext.appliedFilters)}`);
  console.log(`   Response: ${r2.data.message.substring(0, 80)}\n`);
  
  console.log('Product colors:');
  r2.data.products.forEach((p, i) => {
    console.log(`   ${i + 1}. $${p.price} ${p.color}`);
  });
  
  const allSilver = r2.data.products.every(p => p.color && p.color.toUpperCase().includes('SILVER'));
  console.log(`\n${allSilver ? '✓ All products are SILVER' : '❌ Some products are NOT silver'}`);
}

test().catch(e => console.error('Error:', e.message));

