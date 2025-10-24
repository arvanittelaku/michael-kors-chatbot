/**
 * Test suite for user-reported bugs
 * Based on real user testing feedback
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

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
      products: response.data.products || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testBug1_NonProductQuestions() {
  console.log(`${colors.cyan}BUG 1: Non-Product Questions${colors.reset}\n`);
  
  const sessionId = `bug1_${Date.now()}`;
  
  console.log('Query: "sa bejne 1+1?" (what is 1+1?)');
  const r1 = await sendMessage('sa bejne 1+1?', sessionId);
  console.log(`Products returned: ${r1.products.length}`);
  console.log(`Response: ${r1.message.substring(0, 80)}...\n`);
  
  if (r1.products.length > 0) {
    console.log(`${colors.red}❌ BUG: Should NOT return products for math questions${colors.reset}`);
    console.log(`${colors.yellow}Expected: "I only help with products" message${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ Correctly handled non-product question${colors.reset}\n`);
  }
}

async function testBug2_UnknownCategories() {
  console.log(`${colors.cyan}BUG 2: Unknown Categories${colors.reset}\n`);
  
  // Test 1: "kepuce" (shoes)
  console.log('Test 2a: Query "dua kepuce" (I want shoes)');
  const sessionId1 = `bug2a_${Date.now()}`;
  const r1 = await sendMessage('dua kepuce', sessionId1);
  console.log(`Products returned: ${r1.products.length}`);
  console.log(`Product types: ${[...new Set(r1.products.slice(0, 3).map(p => p.name))].join(', ')}`);
  console.log(`Response: ${r1.message.substring(0, 80)}...\n`);
  
  const returnsPantofla = r1.products.some(p => p.name && p.name.toLowerCase().includes('pantofla'));
  if (returnsPantofla) {
    console.log(`${colors.red}❌ BUG: Returns pantofla (slippers) instead of saying "no shoes"${colors.reset}`);
    console.log(`${colors.yellow}Expected: "Më vjen keq, nuk kemi kepuce. Kemi këto kategori: ..."${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ Correctly handled unknown category${colors.reset}\n`);
  }
  
  // Test 2: "atlete" (sneakers/athletic shoes)
  console.log('Test 2b: Query "a keni atlete?" (do you have sneakers?)');
  const sessionId2 = `bug2b_${Date.now()}`;
  const r2 = await sendMessage('a keni atlete?', sessionId2);
  console.log(`Products returned: ${r2.products.length}`);
  console.log(`Product types: ${[...new Set(r2.products.slice(0, 3).map(p => p.name))].join(', ')}`);
  console.log(`Response: ${r2.message.substring(0, 80)}...\n`);
  
  const returnsFustan = r2.products.some(p => p.name && p.name.toUpperCase().includes('FUSTAN'));
  if (returnsFustan) {
    console.log(`${colors.red}❌ BUG: Returns fustan (dresses) instead of saying "no sneakers"${colors.reset}`);
    console.log(`${colors.yellow}Expected: "Më vjen keq, nuk kemi atlete. Kemi këto kategori: ..."${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ Correctly handled unknown category${colors.reset}\n`);
  }
}

async function testBug3_ColorFiltering() {
  console.log(`${colors.cyan}BUG 3: CRITICAL - Color Filter Broken${colors.reset}\n`);
  
  const sessionId = `bug3_${Date.now()}`;
  
  // Establish context
  console.log('Step 1: "a keni pantallona" (establish pants context)');
  const r1 = await sendMessage('a keni pantallona', sessionId);
  console.log(`Products: ${r1.products.length} pants\n`);
  
  // Test silver color filter
  console.log('Step 2: "ngjyre silver nen 30" (silver color under $30)');
  const r2 = await sendMessage('ngjyre silver nen 30', sessionId);
  console.log(`Products returned: ${r2.products.length}`);
  
  r2.products.forEach((p, i) => {
    const isCorrect = p.color && p.color.toUpperCase().includes('SILVER') && p.price < 30;
    const status = isCorrect ? colors.green + '✓' : colors.red + '✗';
    console.log(`  ${i + 1}. ${status} $${p.price} ${p.color}${colors.reset}`);
  });
  
  const allSilver = r2.products.every(p => p.color && p.color.toUpperCase().includes('SILVER'));
  const allUnder30 = r2.products.every(p => p.price < 30);
  
  if (!allSilver) {
    console.log(`\n${colors.red}❌ CRITICAL BUG: Some products are NOT silver!${colors.reset}`);
    const nonSilver = r2.products.filter(p => !p.color || !p.color.toUpperCase().includes('SILVER'));
    console.log(`${colors.yellow}Non-silver products: ${nonSilver.map(p => p.color).join(', ')}${colors.reset}\n`);
  } else if (!allUnder30) {
    console.log(`\n${colors.red}❌ BUG: Some products are over $30!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}✓ All products match filters (silver + under $30)${colors.reset}\n`);
  }
}

async function runTests() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}USER-REPORTED BUGS TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}Based on real user testing feedback${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  await testBug1_NonProductQuestions();
  await testBug2_UnknownCategories();
  await testBug3_ColorFiltering();
  
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}END OF TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
}

runTests().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});

