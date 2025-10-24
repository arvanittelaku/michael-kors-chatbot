/**
 * Debug color filtering issue
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

async function debugColorFilter() {
  console.log('Testing color filter bug...\n');
  
  const sessionId = `color_debug_${Date.now()}`;
  
  // Step 1: Establish pants context
  console.log('Step 1: "a keni pantallona"');
  const r1 = await sendMessage('a keni pantallona', sessionId);
  console.log(`Products: ${r1.products.length}`);
  console.log(`Session filters: ${JSON.stringify(r1.sessionContext?.appliedFilters)}`);
  console.log(`Colors in results: ${[...new Set(r1.products.map(p => p.color))].join(', ')}\n`);
  
  // Step 2: Apply silver + under 30 filter
  console.log('Step 2: "ngjyre silver nen 30"');
  const r2 = await sendMessage('ngjyre silver nen 30', sessionId);
  console.log(`Products: ${r2.products.length}`);
  console.log(`Session filters: ${JSON.stringify(r2.sessionContext?.appliedFilters)}\n`);
  
  console.log('Detailed product list:');
  r2.products.forEach((p, i) => {
    const colorMatch = p.color && p.color.toUpperCase().includes('SILVER');
    const priceMatch = p.price < 30;
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     Price: $${p.price} ${priceMatch ? '✓' : '✗'}`);
    console.log(`     Color: ${p.color} ${colorMatch ? '✓' : '✗'}`);
  });
  
  const wrongColors = r2.products.filter(p => !p.color || !p.color.toUpperCase().includes('SILVER'));
  if (wrongColors.length > 0) {
    console.log(`\n❌ BUG CONFIRMED: ${wrongColors.length} products have wrong colors!`);
    console.log('Wrong color products:');
    wrongColors.forEach(p => {
      console.log(`  - ${p.name}: ${p.color}`);
    });
  } else {
    console.log('\n✓ All products match SILVER color');
  }
}

debugColorFilter().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

