/**
 * Debug script to trace multi-turn context handling
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';
const userId = `debug_${Date.now()}`;

async function testContextFlow() {
  console.log('=' .repeat(60));
  console.log('CONTEXT FLOW DEBUG TEST');
  console.log('=' .repeat(60));
  console.log(`Using userId: ${userId}\n`);

  // Step 1: Ask for towels
  console.log('STEP 1: "peshqir"');
  console.log('-'.repeat(60));
  const response1 = await axios.post(`${API_URL}/chat`, {
    userId,
    message: 'peshqir'
  });
  
  console.log('✅ Response received');
  console.log(`   Products: ${response1.data.products.length}`);
  console.log(`   Session context keys: ${Object.keys(response1.data.sessionContext || {}).join(', ')}`);
  console.log(`   Last category: ${response1.data.sessionContext?.lastCategory}`);
  console.log(`   Message: ${response1.data.message.substring(0, 80)}...`);
  
  if (response1.data.products.length > 0) {
    const prices = response1.data.products.map(p => p.price).sort((a, b) => a - b);
    console.log(`   Price range: $${prices[0]} - $${prices[prices.length - 1]}`);
  }

  // Wait a bit for session to persist
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Filter by price
  console.log('\nSTEP 2: "nën 20" (should filter previous towels)');
  console.log('-'.repeat(60));
  const response2 = await axios.post(`${API_URL}/chat`, {
    userId,
    message: 'nën 20'
  });
  
  console.log('✅ Response received');
  console.log(`   Products: ${response2.data.products.length}`);
  console.log(`   Session context keys: ${Object.keys(response2.data.sessionContext || {}).join(', ')}`);
  console.log(`   Last category: ${response2.data.sessionContext?.lastCategory}`);
  console.log(`   Message: ${response2.data.message.substring(0, 120)}...`);
  
  if (response2.data.products.length > 0) {
    const prices = response2.data.products.map(p => p.price);
    console.log(`   Prices: ${prices.join(', ')}`);
    const allUnder20 = prices.every(p => p < 20);
    console.log(`   All under $20: ${allUnder20 ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log('   ❌ NO PRODUCTS RETURNED');
  }

  // Step 3: Alternative syntax with $ sign
  const userId2 = `debug2_${Date.now()}`;
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`\nSTEP 3: Testing with $ sign (new session: ${userId2})`);
  console.log('-'.repeat(60));
  
  const response3a = await axios.post(`${API_URL}/chat`, {
    userId: userId2,
    message: 'peshqir'
  });
  console.log(`First message: ${response3a.data.products.length} products`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const response3b = await axios.post(`${API_URL}/chat`, {
    userId: userId2,
    message: 'nën $20'
  });
  console.log(`Follow-up "nën $20": ${response3b.data.products.length} products`);
  console.log(`   Message: ${response3b.data.message.substring(0, 120)}...`);

  // Step 4: Single message with both category and price
  console.log('\nSTEP 4: Single message "peshqir nën 20"');
  console.log('-'.repeat(60));
  const response4 = await axios.post(`${API_URL}/chat`, {
    userId: `debug3_${Date.now()}`,
    message: 'peshqir nën 20'
  });
  
  console.log('✅ Response received');
  console.log(`   Products: ${response4.data.products.length}`);
  console.log(`   Message: ${response4.data.message.substring(0, 120)}...`);
  
  if (response4.data.products.length > 0) {
    const prices = response4.data.products.map(p => p.price);
    console.log(`   Prices: ${prices.join(', ')}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Multi-turn (Step 1 → 2): ${response2.data.products.length > 0 ? '✅ WORKS' : '❌ BROKEN'}`);
  console.log(`With $ sign (Step 3): ${response3b.data.products.length > 0 ? '✅ WORKS' : '❌ BROKEN'}`);
  console.log(`Single message (Step 4): ${response4.data.products.length > 0 ? '✅ WORKS' : '❌ BROKEN'}`);
  console.log('='.repeat(60));
}

testContextFlow().catch(console.error);

