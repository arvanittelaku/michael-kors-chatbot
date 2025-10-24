/**
 * Test Exploratory Query Detection and Recovery Intent
 * 
 * Tests the new enhancement for:
 * 1. Exploratory queries (qfar keni?) - should show all options
 * 2. Recovery intent (ndonje tjeter after 0 results) - should reset filters
 * 3. Pagination (ndonje tjeter after success) - should keep working
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';

async function sendMessage(userId, message) {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId,
      message
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      EXPLORATORY QUERY & RECOVERY INTENT TEST SUITE      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════════
  // TEST 1: Exploratory Query - "qfar kemisha keni?"
  // ═══════════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 1: Exploratory Query After Filtering');
  console.log('━'.repeat(60));
  
  const userId1 = `test_exploratory_${Date.now()}`;
  
  console.log('\n📌 Step 1: Filter by brand and color');
  const r1a = await sendMessage(userId1, 'dua kemish boss te zeze');
  console.log(`   Products: ${r1a.data.products.length}`);
  console.log(`   Brands: ${[...new Set(r1a.data.products.map(p => p.brand))].join(', ')}`);
  console.log(`   Colors: ${[...new Set(r1a.data.products.map(p => p.color))].join(', ')}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📌 Step 2: Ask exploratory question "qfar kemisha keni?"');
  const r1b = await sendMessage(userId1, 'qfar kemisha keni?');
  console.log(`   Products: ${r1b.data.products.length}`);
  console.log(`   Brands: ${[...new Set(r1b.data.products.map(p => p.brand))].join(', ')}`);
  console.log(`   Colors: ${[...new Set(r1b.data.products.map(p => p.color))].join(', ')}`);
  
  // Success = more products and different brands/colors
  const hasMoreProducts = r1b.data.products.length > r1a.data.products.length;
  const hasMultipleBrands = new Set(r1b.data.products.map(p => p.brand)).size > 1;
  const test1Pass = hasMoreProducts || hasMultipleBrands;
  
  if (test1Pass) {
    console.log('\n✅ TEST 1 PASSED: Exploratory query showed all options');
    passed++;
  } else {
    console.log('\n❌ TEST 1 FAILED: Still filtered, not showing all options');
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 2: Recovery Intent - "ndonje tjeter" after 0 results
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('TEST 2: Recovery Intent After Failed Search');
  console.log('━'.repeat(60));
  
  const userId2 = `test_recovery_${Date.now()}`;
  
  console.log('\n📌 Step 1: Get shirts');
  const r2a = await sendMessage(userId2, 'dua kemishe');
  console.log(`   Products: ${r2a.data.products.length}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📌 Step 2: Ask for impossible color (red shirts don\'t exist)');
  const r2b = await sendMessage(userId2, 'ngjyre te kuqe');
  console.log(`   Products: ${r2b.data.products.length}`);
  console.log(`   Message: ${r2b.data.message.substring(0, 80)}...`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📌 Step 3: Ask for "ndonje tjeter" (should recover)');
  const r2c = await sendMessage(userId2, 'ndonje tjeter');
  console.log(`   Products: ${r2c.data.products.length}`);
  console.log(`   Message: ${r2c.data.message.substring(0, 80)}...`);
  
  // Success = got products after recovery
  const test2Pass = r2c.data.products.length > 0;
  
  if (test2Pass) {
    console.log('\n✅ TEST 2 PASSED: Recovery intent reset filter and showed products');
    passed++;
  } else {
    console.log('\n❌ TEST 2 FAILED: Still stuck on failed filter');
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 3: Pagination - "ndonje tjeter" after successful results (should still work)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('TEST 3: Pagination Still Works (Backward Compatibility)');
  console.log('━'.repeat(60));
  
  const userId3 = `test_pagination_${Date.now()}`;
  
  console.log('\n📌 Step 1: Get towels');
  const r3a = await sendMessage(userId3, 'dua peshqir');
  console.log(`   Products: ${r3a.data.products.length}`);
  const firstBatch = r3a.data.products.map(p => p.id);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📌 Step 2: Ask for "ndonje tjeter" (should paginate)');
  const r3b = await sendMessage(userId3, 'ndonje tjeter');
  console.log(`   Products: ${r3b.data.products.length}`);
  const secondBatch = r3b.data.products.map(p => p.id);
  
  // Success = got different products (pagination working)
  const hasDifferentProducts = !secondBatch.every(id => firstBatch.includes(id));
  const test3Pass = r3b.data.products.length > 0 && hasDifferentProducts;
  
  if (test3Pass) {
    console.log('\n✅ TEST 3 PASSED: Pagination still works correctly');
    passed++;
  } else {
    console.log('\n❌ TEST 3 FAILED: Pagination broken');
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // TEST 4: Short exploratory query - just category name
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('TEST 4: Short Exploratory Query (Just Category)');
  console.log('━'.repeat(60));
  
  const userId4 = `test_short_${Date.now()}`;
  
  console.log('\n📌 Step 1: Filter by price');
  const r4a = await sendMessage(userId4, 'pantolla nen 30$');
  console.log(`   Products: ${r4a.data.products.length}`);
  const avgPrice1 = r4a.data.products.reduce((sum, p) => sum + p.price, 0) / r4a.data.products.length;
  console.log(`   Average price: $${avgPrice1.toFixed(2)}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n📌 Step 2: Just say "pantolla" (should show all)');
  const r4b = await sendMessage(userId4, 'pantolla');
  console.log(`   Products: ${r4b.data.products.length}`);
  const avgPrice2 = r4b.data.products.reduce((sum, p) => sum + p.price, 0) / r4b.data.products.length;
  console.log(`   Average price: $${avgPrice2.toFixed(2)}`);
  
  // Success = more products or higher average price (not filtered)
  const test4Pass = r4b.data.products.length >= r4a.data.products.length && avgPrice2 > avgPrice1;
  
  if (test4Pass) {
    console.log('\n✅ TEST 4 PASSED: Short query reset filters');
    passed++;
  } else {
    console.log('\n❌ TEST 4 FAILED: Still applying old filters');
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Pass Rate: ${passed}/${passed + failed} (${Math.round(passed / (passed + failed) * 100)}%)`);
  console.log('═'.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Exploratory query detection is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.');
  }
}

runTests().catch(console.error);

