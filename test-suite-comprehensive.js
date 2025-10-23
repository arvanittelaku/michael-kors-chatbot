/**
 * COMPREHENSIVE E-COMMERCE CHATBOT TEST SUITE
 * Albanian Conversational Assistant - Full QA Tests
 * 
 * Run with: node test-suite-comprehensive.js
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = process.env.API_URL || 'https://michael-kors-chatbot.onrender.com';
const OUTPUT_FILE = 'test-results.json';

// Test Results Storage
const testResults = {
  summary: { totalTests: 0, passed: 0, failed: 0, passRate: '' },
  tests: [],
  artifacts: {
    screenshots: [],
    rawLogs: [],
    transcripts: []
  },
  recommendations: []
};

// Helper: Make chat request
async function sendMessage(message, userId = `test_${Date.now()}`) {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId,
      message
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

// Helper: Record test result
function recordTest(testCase) {
  testResults.summary.totalTests++;
  if (testCase.result === 'PASS') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  testResults.tests.push(testCase);
  
  // Print result
  const icon = testCase.result === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${testCase.id}: ${testCase.utterance}`);
  if (testCase.result === 'FAIL') {
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Actual: ${testCase.actual}`);
    console.log(`   Severity: ${testCase.severity}`);
  }
}

// ============================================================================
// TEST SUITE A: Single-turn Category Retrieval
// ============================================================================

async function testA1_CategoryTowels() {
  const testId = 'A1';
  const utterance = 'Kam nevojë për peshqir';
  
  console.log(`\n🧪 Running Test ${testId}: ${utterance}`);
  
  const response = await sendMessage(utterance);
  
  if (!response.success) {
    recordTest({
      id: testId,
      utterance,
      expected: 'Return towels list with price, brand, color',
      actual: `API Error: ${response.error}`,
      result: 'FAIL',
      transcript: JSON.stringify(response, null, 2),
      filters: null,
      backendRequest: { userId: 'test', message: utterance },
      backendResponse: response.data,
      logs: [response.error],
      codeLocations: [
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractCategory', lines: '191-248' },
        { file: 'server/src/services/chatbot/TrieveService.ts', fn: 'getProducts', lines: '15-87' }
      ],
      hypothesis: 'API connection failed or server error',
      severity: 'BLOCKER'
    });
    return;
  }
  
  const products = response.data.products || [];
  const hasPriceUnder20 = products.some(p => p.price < 20);
  const hasPriceOver20 = products.some(p => p.price >= 20);
  const allHavePriceAndBrand = products.every(p => p.price && p.brand && p.color);
  
  const passed = products.length > 0 && hasPriceUnder20 && hasPriceOver20 && allHavePriceAndBrand;
  
  recordTest({
    id: testId,
    utterance,
    expected: 'Return towels with varied prices, all items have price/brand/color',
    actual: `Returned ${products.length} items. Price range: $${Math.min(...products.map(p => p.price))}-$${Math.max(...products.map(p => p.price))}`,
    result: passed ? 'PASS' : 'FAIL',
    transcript: response.data.message,
    filters: { category: 'peshqir' },
    backendRequest: { userId: 'test', message: utterance },
    backendResponse: response.data,
    logs: [],
    codeLocations: [
      { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractCategory', lines: '191-248' }
    ],
    hypothesis: passed ? null : 'Missing price variety or incomplete product data',
    severity: passed ? 'OK' : 'MAJOR'
  });
}

// ============================================================================
// TEST SUITE B: Single-turn Brand Filter
// ============================================================================

async function testB1_BrandFilter() {
  const testId = 'B1';
  const utterance = 'pantolla marka TOM TAILOR';
  
  console.log(`\n🧪 Running Test ${testId}: ${utterance}`);
  
  const response = await sendMessage(utterance);
  
  if (!response.success) {
    recordTest({
      id: testId,
      utterance,
      expected: 'Only TOM TAILOR pants',
      actual: `API Error: ${response.error}`,
      result: 'FAIL',
      transcript: JSON.stringify(response, null, 2),
      filters: null,
      backendRequest: { userId: 'test', message: utterance },
      backendResponse: response.data,
      logs: [response.error],
      codeLocations: [
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractBrand', lines: '338-457' }
      ],
      hypothesis: 'API connection failed',
      severity: 'BLOCKER'
    });
    return;
  }
  
  const products = response.data.products || [];
  const allTomTailor = products.every(p => p.brand && p.brand.toUpperCase() === 'TOM TAILOR');
  const hasTomTailor = products.length > 0;
  
  const passed = hasTomTailor && allTomTailor;
  
  recordTest({
    id: testId,
    utterance,
    expected: 'Only TOM TAILOR pants returned',
    actual: `Returned ${products.length} items. Brands: ${[...new Set(products.map(p => p.brand))].join(', ')}`,
    result: passed ? 'PASS' : 'FAIL',
    transcript: response.data.message,
    filters: { category: 'pantallona', brand: 'TOM TAILOR' },
    backendRequest: { userId: 'test', message: utterance },
    backendResponse: response.data,
    logs: [],
    codeLocations: [
      { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractBrand', lines: '338-457' },
      { file: 'server/src/services/chatbot/TrieveService.ts', fn: 'matchesBrand', lines: '478-485' }
    ],
    hypothesis: passed ? null : 'Brand filter not applied or mixed brands returned',
    severity: passed ? 'OK' : 'BLOCKER'
  });
}

// ============================================================================
// TEST SUITE C: Single-turn Color Filter (different syntaxes)
// ============================================================================

async function testC_ColorFilterVariants() {
  const variants = [
    { id: 'C1', utterance: 'peshqir i kuq', syntax: 'masculine definite' },
    { id: 'C2', utterance: 'peshqir te kuq', syntax: 'with preposition te' },
    { id: 'C3', utterance: 'peshqir ngjyrë e kuqe', syntax: 'with ngjyrë keyword' }
  ];
  
  const results = [];
  
  for (const variant of variants) {
    console.log(`\n🧪 Running Test ${variant.id}: ${variant.utterance} (${variant.syntax})`);
    
    const response = await sendMessage(variant.utterance);
    
    if (!response.success) {
      recordTest({
        id: variant.id,
        utterance: variant.utterance,
        expected: 'Red towels only',
        actual: `API Error: ${response.error}`,
        result: 'FAIL',
        transcript: JSON.stringify(response, null, 2),
        filters: { category: 'peshqir', color: 'red' },
        backendRequest: { userId: 'test', message: variant.utterance },
        backendResponse: response.data,
        logs: [response.error],
        codeLocations: [
          { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractColor', lines: '250-257' }
        ],
        hypothesis: 'API error or color pattern not recognized',
        severity: 'BLOCKER'
      });
      continue;
    }
    
    const products = response.data.products || [];
    const allRed = products.every(p => p.color && p.color.toUpperCase().includes('RED'));
    const hasRed = products.length > 0;
    const noBrandError = !response.data.message.includes('markën') && !response.data.message.includes('KUQ');
    
    const passed = hasRed && allRed && noBrandError;
    
    recordTest({
      id: variant.id,
      utterance: variant.utterance,
      expected: 'Red towels, no brand misclassification',
      actual: `Returned ${products.length} items. Colors: ${[...new Set(products.map(p => p.color))].join(', ')}. Brand error: ${!noBrandError}`,
      result: passed ? 'PASS' : 'FAIL',
      transcript: response.data.message,
      filters: { category: 'peshqir', color: 'red' },
      backendRequest: { userId: 'test', message: variant.utterance },
      backendResponse: response.data,
      logs: [],
      codeLocations: [
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractColor', lines: '250-257' },
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractBrand', lines: '417-420' }
      ],
      hypothesis: passed ? null : (noBrandError ? 'Color not detected' : 'Color word misclassified as brand'),
      severity: passed ? 'OK' : 'BLOCKER'
    });
    
    results.push({ variant: variant.id, products: products.length });
  }
  
  // Check consistency across variants
  const allSameCount = results.every(r => r.products === results[0].products);
  if (!allSameCount) {
    console.log(`⚠️  WARNING: Color variants returned different counts: ${results.map(r => `${r.variant}:${r.products}`).join(', ')}`);
  }
}

// ============================================================================
// TEST SUITE D: Price Filtering & Sorting
// ============================================================================

async function testD1_PriceUnder20() {
  const testId = 'D1';
  const utterance = 'peshqir nën $20';
  
  console.log(`\n🧪 Running Test ${testId}: ${utterance}`);
  
  const response = await sendMessage(utterance);
  
  if (!response.success) {
    recordTest({
      id: testId,
      utterance,
      expected: 'Towels with price < $20',
      actual: `API Error: ${response.error}`,
      result: 'FAIL',
      transcript: JSON.stringify(response, null, 2),
      filters: { category: 'peshqir', priceMax: 20 },
      backendRequest: { userId: 'test', message: utterance },
      backendResponse: response.data,
      logs: [response.error],
      codeLocations: [
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractPrice', lines: '259-300' }
      ],
      hypothesis: 'API error',
      severity: 'BLOCKER'
    });
    return;
  }
  
  const products = response.data.products || [];
  const allUnder20 = products.every(p => p.price < 20);
  const hasProducts = products.length > 0;
  
  const passed = hasProducts && allUnder20;
  
  recordTest({
    id: testId,
    utterance,
    expected: 'Only towels with price < $20',
    actual: `Returned ${products.length} items. Prices: ${products.map(p => `$${p.price}`).join(', ')}`,
    result: passed ? 'PASS' : 'FAIL',
    transcript: response.data.message,
    filters: { category: 'peshqir', priceMax: 20 },
    backendRequest: { userId: 'test', message: utterance },
    backendResponse: response.data,
    logs: [],
    codeLocations: [
      { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractPrice', lines: '277-281' },
      { file: 'server/src/services/chatbot/TrieveService.ts', fn: 'matchesPrice', lines: '435-449' }
    ],
    hypothesis: passed ? null : 'Price filter not applied correctly',
    severity: passed ? 'OK' : 'MAJOR'
  });
}

async function testD2_PriceSortCheaper() {
  const testId = 'D2';
  const utterance = 'peshqir më të lira';
  
  console.log(`\n🧪 Running Test ${testId}: ${utterance}`);
  
  const response = await sendMessage(utterance);
  
  if (!response.success) {
    recordTest({
      id: testId,
      utterance,
      expected: 'Towels sorted by price ascending',
      actual: `API Error: ${response.error}`,
      result: 'FAIL',
      transcript: JSON.stringify(response, null, 2),
      filters: { category: 'peshqir', sortBy: 'price_asc' },
      backendRequest: { userId: 'test', message: utterance },
      backendResponse: response.data,
      logs: [response.error],
      codeLocations: [
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractPrice', lines: '263-269' }
      ],
      hypothesis: 'API error',
      severity: 'BLOCKER'
    });
    return;
  }
  
  const products = response.data.products || [];
  const prices = products.map(p => p.price);
  const isSorted = prices.every((price, i) => i === 0 || price >= prices[i - 1]);
  const noBrandLiraError = !response.data.message.includes('markën') && !response.data.message.includes('LIRA');
  
  const passed = products.length > 0 && isSorted && noBrandLiraError;
  
  recordTest({
    id: testId,
    utterance,
    expected: 'Towels sorted cheapest first, no LIRA brand error',
    actual: `Returned ${products.length} items. Prices: ${prices.join(', ')}. Sorted: ${isSorted}. No LIRA error: ${noBrandLiraError}`,
    result: passed ? 'PASS' : 'FAIL',
    transcript: response.data.message,
    filters: { category: 'peshqir', sortBy: 'price_asc' },
    backendRequest: { userId: 'test', message: utterance },
    backendResponse: response.data,
    logs: [],
    codeLocations: [
      { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractPrice', lines: '263-269' },
      { file: 'server/src/services/chatbot/ChatbotService.ts', fn: 'handleMessage', lines: '72-78' }
    ],
    hypothesis: passed ? null : (noBrandLiraError ? 'Sorting not applied' : '"më të lira" misclassified as brand LIRA'),
    severity: passed ? 'OK' : 'BLOCKER'
  });
}

// ============================================================================
// TEST SUITE E: Multi-turn Filtering
// ============================================================================

async function testE1_MultiTurnPriceFilter() {
  const testId = 'E1';
  const userId = `test_multiturn_${Date.now()}`;
  
  console.log(`\n🧪 Running Test ${testId}: Multi-turn (peshqir → nën $20)`);
  
  // First message: category
  const response1 = await sendMessage('peshqir', userId);
  if (!response1.success) {
    recordTest({
      id: testId,
      utterance: 'peshqir → nën $20',
      expected: 'Multi-turn: first get towels, then filter by price',
      actual: `First message failed: ${response1.error}`,
      result: 'FAIL',
      transcript: JSON.stringify(response1, null, 2),
      filters: null,
      backendRequest: null,
      backendResponse: null,
      logs: [response1.error],
      codeLocations: [
        { file: 'server/src/services/chatbot/SessionManager.ts', fn: 'updateSession', lines: '25-59' }
      ],
      hypothesis: 'Session management issue',
      severity: 'BLOCKER'
    });
    return;
  }
  
  const initialCount = response1.data.products?.length || 0;
  
  // Second message: price filter
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for session to persist
  const response2 = await sendMessage('nën $20', userId);
  
  if (!response2.success) {
    recordTest({
      id: testId,
      utterance: 'peshqir → nën $20',
      expected: 'Second message filters previous results',
      actual: `Second message failed: ${response2.error}`,
      result: 'FAIL',
      transcript: JSON.stringify(response2, null, 2),
      filters: { category: 'peshqir', priceMax: 20 },
      backendRequest: null,
      backendResponse: null,
      logs: [response2.error],
      codeLocations: [
        { file: 'server/src/services/chatbot/ChatbotService.ts', fn: 'applyContextFiltering', lines: '216-275' }
      ],
      hypothesis: 'Context not preserved across turns',
      severity: 'BLOCKER'
    });
    return;
  }
  
  const filteredCount = response2.data.products?.length || 0;
  const allUnder20 = response2.data.products?.every(p => p.price < 20) || false;
  const contextPreserved = filteredCount < initialCount || (filteredCount > 0 && allUnder20);
  
  const passed = filteredCount > 0 && allUnder20 && contextPreserved;
  
  recordTest({
    id: testId,
    utterance: 'peshqir → nën $20',
    expected: 'Follow-up filters previous category results',
    actual: `Initial: ${initialCount} items. After filter: ${filteredCount} items (all < $20: ${allUnder20})`,
    result: passed ? 'PASS' : 'FAIL',
    transcript: `Turn 1: ${response1.data.message}\nTurn 2: ${response2.data.message}`,
    filters: { category: 'peshqir', priceMax: 20 },
    backendRequest: { userId, message: 'nën $20' },
    backendResponse: response2.data,
    logs: [],
    codeLocations: [
      { file: 'server/src/services/chatbot/ChatbotService.ts', fn: 'applyContextFiltering', lines: '231-234' },
      { file: 'server/src/services/chatbot/SessionManager.ts', fn: 'getSession', lines: '61-68' }
    ],
    hypothesis: passed ? null : 'Context not preserved or price filter not applied to previous category',
    severity: passed ? 'OK' : 'BLOCKER'
  });
}

// ============================================================================
// TEST SUITE F: Mixed and Ambiguous Phrases
// ============================================================================

async function testF_AmbiguousPhrases() {
  const testCases = [
    { id: 'F1', utterance: 'peshqir te kuq', expected: 'Color RED (not brand KUQ)', checkFn: (r) => r.data.products?.some(p => p.color?.toUpperCase().includes('RED')) && !r.data.message.includes('markën') && !r.data.message.includes('KUQ') },
    { id: 'F2', utterance: 'pantolla te boss', expected: 'Brand BOSS', checkFn: (r) => r.data.products?.every(p => p.brand?.toUpperCase() === 'BOSS') },
    { id: 'F3', utterance: 'me te lira', expected: 'Price sort (not brand LIRA)', checkFn: (r) => !r.data.message.includes('markën') && !r.data.message.includes('LIRA') },
    { id: 'F4', utterance: 'tom tailor', expected: 'Brand TOM TAILOR (lowercase)', checkFn: (r) => r.data.products?.every(p => p.brand?.toUpperCase() === 'TOM TAILOR') }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Running Test ${testCase.id}: ${testCase.utterance}`);
    
    const response = await sendMessage(testCase.utterance);
    
    if (!response.success) {
      recordTest({
        id: testCase.id,
        utterance: testCase.utterance,
        expected: testCase.expected,
        actual: `API Error: ${response.error}`,
        result: 'FAIL',
        transcript: JSON.stringify(response, null, 2),
        filters: null,
        backendRequest: { userId: 'test', message: testCase.utterance },
        backendResponse: response.data,
        logs: [response.error],
        codeLocations: [
          { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractBrand', lines: '417-420' }
        ],
        hypothesis: 'Disambiguation logic failed',
        severity: 'BLOCKER'
      });
      continue;
    }
    
    const passed = testCase.checkFn(response);
    
    recordTest({
      id: testCase.id,
      utterance: testCase.utterance,
      expected: testCase.expected,
      actual: `Products: ${response.data.products?.length || 0}. Message: ${response.data.message.substring(0, 100)}...`,
      result: passed ? 'PASS' : 'FAIL',
      transcript: response.data.message,
      filters: null,
      backendRequest: { userId: 'test', message: testCase.utterance },
      backendResponse: response.data,
      logs: [],
      codeLocations: [
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractBrand', lines: '417-420' },
        { file: 'server/src/services/chatbot/MessageParser.ts', fn: 'extractColor', lines: '64-69' }
      ],
      hypothesis: passed ? null : 'Ambiguity not resolved correctly',
      severity: passed ? 'OK' : 'BLOCKER'
    });
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ALBANIAN E-COMMERCE CHATBOT - COMPREHENSIVE TEST SUITE  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`API URL: ${API_URL}\n`);
  
  try {
    // Suite A: Category Retrieval
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE A: Single-turn Category Retrieval');
    console.log('='.repeat(60));
    await testA1_CategoryTowels();
    
    // Suite B: Brand Filter
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE B: Single-turn Brand Filter');
    console.log('='.repeat(60));
    await testB1_BrandFilter();
    
    // Suite C: Color Filter Variants
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE C: Single-turn Color Filter (different syntaxes)');
    console.log('='.repeat(60));
    await testC_ColorFilterVariants();
    
    // Suite D: Price Filtering & Sorting
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE D: Price Filtering & Sorting');
    console.log('='.repeat(60));
    await testD1_PriceUnder20();
    await testD2_PriceSortCheaper();
    
    // Suite E: Multi-turn Filtering
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE E: Multi-turn Filtering');
    console.log('='.repeat(60));
    await testE1_MultiTurnPriceFilter();
    
    // Suite F: Ambiguous Phrases
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE F: Mixed and Ambiguous Phrases');
    console.log('='.repeat(60));
    await testF_AmbiguousPhrases();
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    testResults.summary.fatalError = error.message;
  }
  
  // Calculate summary
  testResults.summary.passRate = `${testResults.summary.passed}/${testResults.summary.totalTests}`;
  
  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testResults, null, 2));
  
  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`Pass Rate: ${testResults.summary.passRate} (${Math.round(testResults.summary.passed / testResults.summary.totalTests * 100)}%)`);
  console.log(`\nResults saved to: ${OUTPUT_FILE}`);
  
  // List critical failures
  const blockers = testResults.tests.filter(t => t.severity === 'BLOCKER' && t.result === 'FAIL');
  if (blockers.length > 0) {
    console.log('\n⚠️  BLOCKER ISSUES:');
    blockers.forEach(b => {
      console.log(`   - ${b.id}: ${b.utterance}`);
      console.log(`     Hypothesis: ${b.hypothesis}`);
    });
  }
  
  console.log('\n' + '═'.repeat(60));
}

// Run the test suite
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

