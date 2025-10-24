/**
 * Comprehensive Chatbot Test Suite
 * Tests the chatbot as a real user would interact with it
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';
const TEST_USER_ID = `test_user_${Date.now()}`;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Send a message to the chatbot
 */
async function sendMessage(message, sessionId = TEST_USER_ID) {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId: sessionId,
      message: message
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
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
      error: error.message,
      details: error.response?.data || error.toString()
    };
  }
}

/**
 * Log test result
 */
function logTest(testName, passed, actual, expected, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`${colors.green}✓ PASS${colors.reset} ${testName}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗ FAIL${colors.reset} ${testName}`);
    console.log(`  ${colors.yellow}Expected:${colors.reset} ${expected}`);
    console.log(`  ${colors.yellow}Actual:${colors.reset} ${actual}`);
    if (details) {
      console.log(`  ${colors.yellow}Details:${colors.reset} ${details}`);
    }
  }
}

/**
 * Test Suite 1: Brand Existence vs Filter Mismatch
 */
async function testBrandExistenceVsFilters() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 1: Brand Existence vs Filter Mismatch ===${colors.reset}\n`);
  
  const sessionId = `test_brand_${Date.now()}`;
  
  // Test 1: Check available brands for towels
  console.log(`${colors.blue}Test 1.1: Checking available towel brands${colors.reset}`);
  const test1 = await sendMessage('qfar brende te peshqirave keni', sessionId);
  logTest(
    'Shows both OZDILEK and SHEFAME as available brands',
    test1.success && test1.message.includes('OZDILEK') && test1.message.includes('SHEFAME'),
    test1.message,
    'Message should contain both OZDILEK and SHEFAME'
  );
  
  // Test 2: Request SHEFAME with impossible filters
  console.log(`${colors.blue}Test 1.2: Request SHEFAME black towel under $20${colors.reset}`);
  const test2 = await sendMessage('dua nje peshqir shefame me qmim me te ulet se 20 euro, ngjyr te zez', sessionId);
  
  const shefameExists = !test2.message.includes('nuk kemi markën "SHEFAME"') && 
                        !test2.message.includes('nuk kemi markën "shefame"');
  const showsShefameProducts = test2.products.length > 0 && 
                               test2.products.some(p => p.brand === 'SHEFAME');
  
  logTest(
    'Should say filters don\'t match, NOT that SHEFAME doesn\'t exist',
    test2.success && shefameExists,
    test2.message.substring(0, 100),
    'Should mention specific filters not available, NOT brand not existing'
  );
  
  logTest(
    'Should show SHEFAME products (any color/price)',
    showsShefameProducts,
    `Showed ${test2.products.filter(p => p.brand === 'SHEFAME').length} SHEFAME products`,
    'Should show at least 1 SHEFAME product'
  );
  
  // Test 3: Request truly non-existent brand
  console.log(`${colors.blue}Test 1.3: Request NIKE towel (doesn't exist)${colors.reset}`);
  const test3 = await sendMessage('dua nje peshqir nike', sessionId);
  
  const nikeDoesntExist = test3.message.toLowerCase().includes('nuk kemi markën') && 
                          test3.message.toUpperCase().includes('NIKE');
  const showsAvailableBrands = test3.message.includes('OZDILEK') || test3.message.includes('SHEFAME');
  
  logTest(
    'Should say NIKE brand doesn\'t exist',
    test3.success && nikeDoesntExist,
    test3.message.substring(0, 100),
    'Should say "nuk kemi markën NIKE"'
  );
  
  logTest(
    'Should show available brands',
    showsAvailableBrands,
    test3.message,
    'Should mention OZDILEK or SHEFAME as alternatives'
  );
}

/**
 * Test Suite 2: Filter Clearing on New Queries
 */
async function testFilterClearing() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 2: Filter Clearing ===${colors.reset}\n`);
  
  const sessionId = `test_filter_${Date.now()}`;
  
  // Test 1: Request shirt with non-existent brand
  console.log(`${colors.blue}Test 2.1: Request NIKE shirt (doesn't exist)${colors.reset}`);
  const test1 = await sendMessage('dua nje kemishe te brendit nike', sessionId);
  logTest(
    'Should say NIKE doesn\'t exist for kemishe',
    test1.success && test1.message.toUpperCase().includes('NIKE'),
    test1.message.substring(0, 80),
    'Should mention NIKE not available'
  );
  
  // Test 2: Add color filter (should clear failed brand)
  console.log(`${colors.blue}Test 2.2: Request black shirt (should clear NIKE filter)${colors.reset}`);
  const test2 = await sendMessage('dua nje te zeze', sessionId);
  
  const nikeNotMentioned = !test2.message.toUpperCase().includes('NIKE');
  const hasBlackShirts = test2.products.length > 0 && 
                         test2.products.some(p => p.color && p.color.toUpperCase().includes('BLACK'));
  
  logTest(
    'Should NOT mention NIKE anymore',
    test2.success && nikeNotMentioned,
    test2.message.substring(0, 80),
    'Should not mention NIKE (failed brand should be cleared)'
  );
  
  logTest(
    'Should show black shirts',
    hasBlackShirts,
    `Showed ${test2.products.filter(p => p.color && p.color.toUpperCase().includes('BLACK')).length} black products`,
    'Should show black shirts'
  );
}

/**
 * Test Suite 3: Category Listing
 */
async function testCategoryListing() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 3: Category Listing ===${colors.reset}\n`);
  
  const sessionId = `test_category_${Date.now()}`;
  
  // Test: Ask what products are available
  console.log(`${colors.blue}Test 3.1: Ask what products are available${colors.reset}`);
  const test1 = await sendMessage('qfar produkte keni?', sessionId);
  
  const hasCategories = test1.message.includes('kemishe') || test1.message.includes('Kemishe') ||
                        test1.message.includes('pantallona') || test1.message.includes('Pantallona');
  
  logTest(
    'Should list available categories',
    test1.success && hasCategories,
    test1.message.substring(0, 100),
    'Should list categories like kemishe, pantallona, peshqir, etc.'
  );
}

/**
 * Test Suite 4: Price Filtering
 */
async function testPriceFiltering() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 4: Price Filtering ===${colors.reset}\n`);
  
  const sessionId = `test_price_${Date.now()}`;
  
  // Test 1: Request products under specific price
  console.log(`${colors.blue}Test 4.1: Request towels under $15${colors.reset}`);
  const test1 = await sendMessage('dua peshqir nen 15$', sessionId);
  
  const allUnder15 = test1.products.length > 0 && 
                     test1.products.every(p => p.price < 15);
  
  logTest(
    'All products should be under $15',
    test1.success && allUnder15,
    `Prices: ${test1.products.map(p => `$${p.price}`).slice(0, 5).join(', ')}`,
    'All products under $15'
  );
  
  // Test 2: Request with "me i vogel se" (smaller than)
  console.log(`${colors.blue}Test 4.2: Request with "me i vogel se 20 euro"${colors.reset}`);
  const test2 = await sendMessage('pantofla me qmim me i vogel se 20 euro', sessionId);
  
  const allUnder20 = test2.products.length > 0 && 
                     test2.products.every(p => p.price < 20);
  
  logTest(
    'Natural language price filter should work',
    test2.success && allUnder20,
    `Prices: ${test2.products.map(p => `$${p.price}`).slice(0, 5).join(', ')}`,
    'All products under $20'
  );
}

/**
 * Test Suite 5: Brand Availability for Single-Brand Categories
 */
async function testSingleBrandCategory() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 5: Single-Brand Categories ===${colors.reset}\n`);
  
  const sessionId = `test_single_brand_${Date.now()}`;
  
  // Test 1: Ask for shirt brands
  console.log(`${colors.blue}Test 5.1: Ask what shirt brands are available${colors.reset}`);
  const test1 = await sendMessage('qfar brende te kemishave keni', sessionId);
  
  const mentionsBOSS = test1.message.includes('BOSS');
  const mentionsOnlyOne = test1.message.includes('vetëm') || test1.message.includes('vetem');
  
  logTest(
    'Should say only BOSS is available',
    test1.success && mentionsBOSS && mentionsOnlyOne,
    test1.message,
    'Should mention "vetëm marka BOSS"'
  );
  
  // Test 2: Ask for another brand
  console.log(`${colors.blue}Test 5.2: Ask for another shirt brand${colors.reset}`);
  const test2 = await sendMessage('a keni ndonje brend tjeter', sessionId);
  
  logTest(
    'Should confirm only BOSS is available',
    test2.success && test2.message.includes('BOSS') && mentionsOnlyOne,
    test2.message,
    'Should say only BOSS is available for kemishe'
  );
}

/**
 * Test Suite 6: Color Filtering
 */
async function testColorFiltering() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 6: Color Filtering ===${colors.reset}\n`);
  
  const sessionId = `test_color_${Date.now()}`;
  
  // Test: Request black shirts
  console.log(`${colors.blue}Test 6.1: Request black shirts${colors.reset}`);
  const test1 = await sendMessage('dua kemishe te zeza', sessionId);
  
  const hasBlackShirts = test1.products.length > 0 && 
                         test1.products.every(p => 
                           p.color && (p.color.toUpperCase().includes('BLACK') || 
                                      p.color.toLowerCase().includes('zez'))
                         );
  
  logTest(
    'Should show only black shirts',
    test1.success && hasBlackShirts,
    `Colors: ${test1.products.map(p => p.color).slice(0, 5).join(', ')}`,
    'All products should be black'
  );
}

/**
 * Test Suite 7: CORS and Connectivity
 */
async function testConnectivity() {
  console.log(`\n${colors.cyan}${colors.bright}=== Test Suite 7: Connectivity ===${colors.reset}\n`);
  
  // Test: Basic connectivity
  console.log(`${colors.blue}Test 7.1: Test API connectivity${colors.reset}`);
  const test1 = await sendMessage('dua qante');
  
  logTest(
    'API should respond without CORS errors',
    test1.success && !test1.error,
    test1.success ? 'Success' : test1.error,
    'Should not have CORS or network errors'
  );
  
  logTest(
    'Should return products',
    test1.products && test1.products.length > 0,
    `Returned ${test1.products?.length || 0} products`,
    'Should return at least 1 product'
  );
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE CHATBOT TEST SUITE                      ║');
  console.log('║     Testing: ' + API_URL.padEnd(40) + '║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const startTime = Date.now();
  
  try {
    await testConnectivity();
    await testCategoryListing();
    await testBrandExistenceVsFilters();
    await testFilterClearing();
    await testPriceFiltering();
    await testSingleBrandCategory();
    await testColorFiltering();
  } catch (error) {
    console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error.message);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║                    TEST SUMMARY                            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration}s\n`);
  
  if (failedTests === 0) {
    console.log(`${colors.green}${colors.bright}🎉 All tests passed! Chatbot is working correctly.${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  Some tests failed. Review the failures above.${colors.reset}\n`);
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});

