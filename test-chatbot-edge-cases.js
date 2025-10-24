/**
 * Edge Cases Test Suite
 * Tests specific bugs we've fixed and edge cases
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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

function logTest(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (details) console.log(`  ${colors.yellow}${details}${colors.reset}`);
  }
}

/**
 * Edge Case 1: The SHEFAME Contradiction Bug
 * User sees SHEFAME exists, then bot says it doesn't
 */
async function testShefameContradiction() {
  console.log(`\n${colors.cyan}${colors.bright}=== Edge Case 1: SHEFAME Contradiction ===${colors.reset}`);
  console.log(`${colors.blue}Scenario: List brands, then request impossible SHEFAME combo${colors.reset}\n`);
  
  const sessionId = `edge_shefame_${Date.now()}`;
  
  // Step 1: List brands
  console.log('  Query 1: "qfar brende te peshqirave keni"');
  const r1 = await sendMessage('qfar brende te peshqirave keni', sessionId);
  console.log(`  Response: ${r1.message.substring(0, 80)}...`);
  
  const showsShefame = r1.message.includes('SHEFAME');
  logTest(
    'Step 1: Should list SHEFAME as available',
    showsShefame,
    `Message: ${r1.message}`
  );
  
  // Step 2: Request SHEFAME with impossible filters
  console.log('\n  Query 2: "dua nje peshqir shefame me qmim me te ulet se 20 euro, ngjyr te zez"');
  const r2 = await sendMessage('dua nje peshqir shefame me qmim me te ulet se 20 euro, ngjyr te zez', sessionId);
  console.log(`  Response: ${r2.message.substring(0, 80)}...`);
  console.log(`  Products: ${r2.products.length} (${r2.products.map(p => p.brand).slice(0, 3).join(', ')})`);
  
  const doesntSayBrandMissing = !r2.message.includes('nuk kemi markën "SHEFAME"') &&
                                !r2.message.includes('nuk kemi markën "shefame"');
  const showsShefameProducts = r2.products.some(p => p.brand === 'SHEFAME');
  
  logTest(
    'Step 2: Should NOT say "SHEFAME doesn\'t exist"',
    doesntSayBrandMissing,
    `Message should say filters don't match, not brand missing`
  );
  
  logTest(
    'Step 2: Should show SHEFAME products',
    showsShefameProducts,
    `Should show SHEFAME products in any color/price`
  );
}

/**
 * Edge Case 2: Failed Brand Persistence
 * NIKE filter should clear when user adds color/price
 */
async function testFailedBrandPersistence() {
  console.log(`\n${colors.cyan}${colors.bright}=== Edge Case 2: Failed Brand Persistence ===${colors.reset}`);
  console.log(`${colors.blue}Scenario: Request NIKE (fails), then add color filter${colors.reset}\n`);
  
  const sessionId = `edge_nike_${Date.now()}`;
  
  // Step 1: Request NIKE shirt
  console.log('  Query 1: "dua nje kemishe te brendit nike"');
  const r1 = await sendMessage('dua nje kemishe te brendit nike', sessionId);
  console.log(`  Response: ${r1.message.substring(0, 80)}...`);
  
  const nikeNotFound = r1.message.toUpperCase().includes('NIKE');
  logTest(
    'Step 1: Should say NIKE not available',
    nikeNotFound,
    'Should mention NIKE not found'
  );
  
  // Step 2: Add color filter
  console.log('\n  Query 2: "dua nje te zeze"');
  const r2 = await sendMessage('dua nje te zeze', sessionId);
  console.log(`  Response: ${r2.message.substring(0, 80)}...`);
  console.log(`  Products: ${r2.products.length} black shirts`);
  
  const nikeCleaned = !r2.message.toUpperCase().includes('NIKE');
  const hasBlackShirts = r2.products.length > 0 && 
                         r2.products.some(p => p.color && p.color.toUpperCase().includes('BLACK'));
  
  logTest(
    'Step 2: Should NOT mention NIKE anymore',
    nikeCleaned,
    'Failed brand should be cleared when user adds new filters'
  );
  
  logTest(
    'Step 2: Should show black shirts',
    hasBlackShirts,
    `Should show ${r2.products.length} black BOSS shirts`
  );
}

/**
 * Edge Case 3: kemishe Not Working
 * kemishe was returning 0 results due to case mismatch
 */
async function testKemisheCategory() {
  console.log(`\n${colors.cyan}${colors.bright}=== Edge Case 3: kemishe Category ===${colors.reset}`);
  console.log(`${colors.blue}Scenario: Request kemishe products${colors.reset}\n`);
  
  const sessionId = `edge_kemishe_${Date.now()}`;
  
  console.log('  Query: "dua nje kemishe"');
  const r1 = await sendMessage('dua nje kemishe', sessionId);
  console.log(`  Response: ${r1.message.substring(0, 80)}...`);
  console.log(`  Products: ${r1.products.length} shirts`);
  
  const hasProducts = r1.products.length > 0;
  const allShirts = r1.products.every(p => {
    if (!p.name) return false;
    const nameUpper = p.name.toUpperCase();
    // Handle Albanian diacritics: Ë → E
    const nameNormalized = nameUpper.replace(/Ë/g, 'E').replace(/Ç/g, 'C');
    return nameNormalized.includes('KEMISH') || nameNormalized.includes('SHIRT');
  });
  
  logTest(
    'Should return kemishe products',
    hasProducts,
    `Returned ${r1.products.length} products`
  );
  
  logTest(
    'All products should be shirts',
    allShirts || r1.products.length === 0,
    `Product names: ${r1.products.slice(0, 3).map(p => p.name).join(', ')}`
  );
}

/**
 * Edge Case 4: Natural Language Price Patterns
 * "me i vogel se X euro" should work
 */
async function testNaturalLanguagePrice() {
  console.log(`\n${colors.cyan}${colors.bright}=== Edge Case 4: Natural Language Price ===${colors.reset}`);
  console.log(`${colors.blue}Scenario: Use "me i vogel se 20 euro"${colors.reset}\n`);
  
  const sessionId = `edge_price_${Date.now()}`;
  
  console.log('  Query: "pantofla me qmim me i vogel se 20 euro"');
  const r1 = await sendMessage('pantofla me qmim me i vogel se 20 euro', sessionId);
  console.log(`  Products: ${r1.products.length} slippers`);
  console.log(`  Prices: ${r1.products.slice(0, 5).map(p => `$${p.price}`).join(', ')}`);
  
  const allUnder20 = r1.products.length > 0 && r1.products.every(p => p.price < 20);
  const maxPrice = r1.products.length > 0 ? Math.max(...r1.products.map(p => p.price)) : 0;
  
  logTest(
    'All products should be under $20',
    allUnder20,
    `Max price: $${maxPrice} (should be < 20)`
  );
}

/**
 * Edge Case 5: Single Brand Category
 * kemishe only has BOSS, should say so
 */
async function testSingleBrandMessage() {
  console.log(`\n${colors.cyan}${colors.bright}=== Edge Case 5: Single Brand Message ===${colors.reset}`);
  console.log(`${colors.blue}Scenario: Ask for kemishe brands (only BOSS exists)${colors.reset}\n`);
  
  const sessionId = `edge_single_${Date.now()}`;
  
  console.log('  Query: "qfar brende te kemishave keni"');
  const r1 = await sendMessage('qfar brende te kemishave keni', sessionId);
  console.log(`  Response: ${r1.message}`);
  
  const mentionsBOSS = r1.message.includes('BOSS');
  const saysOnlyOne = r1.message.includes('vetëm') || r1.message.includes('vetem');
  
  logTest(
    'Should say only BOSS is available',
    mentionsBOSS && saysOnlyOne,
    'Should say "vetëm marka BOSS"'
  );
}

/**
 * Edge Case 6: Multiple Brands Category
 * peshqir has multiple brands, should list them
 */
async function testMultipleBrandsMessage() {
  console.log(`\n${colors.cyan}${colors.bright}=== Edge Case 6: Multiple Brands Message ===${colors.reset}`);
  console.log(`${colors.blue}Scenario: Ask for peshqir brands (OZDILEK, SHEFAME)${colors.reset}\n`);
  
  const sessionId = `edge_multi_${Date.now()}`;
  
  console.log('  Query: "qfar brende te peshqirave keni"');
  const r1 = await sendMessage('qfar brende te peshqirave keni', sessionId);
  console.log(`  Response: ${r1.message}`);
  
  const hasOzdilek = r1.message.includes('OZDILEK');
  const hasShefame = r1.message.includes('SHEFAME');
  
  logTest(
    'Should list both OZDILEK and SHEFAME',
    hasOzdilek && hasShefame,
    'Should mention both brands explicitly'
  );
}

/**
 * Run all edge case tests
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           EDGE CASES & BUG REGRESSION TESTS                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const startTime = Date.now();
  
  try {
    await testKemisheCategory();
    await testNaturalLanguagePrice();
    await testShefameContradiction();
    await testFailedBrandPersistence();
    await testSingleBrandMessage();
    await testMultipleBrandsMessage();
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n${colors.bright}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║                    TEST SUMMARY                            ║${colors.reset}`);
  console.log(`${colors.bright}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration}s\n`);
  
  if (failedTests === 0) {
    console.log(`${colors.green}${colors.bright}🎉 All edge cases pass! No regressions detected.${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  Some edge cases failed. Review above.${colors.reset}\n`);
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});

