/**
 * Debug script to understand why "qfar kemisha keni?" doesn't clear brand
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com';

async function debugTest() {
  console.log('🔍 DEBUG: Exploratory Query Brand Clearing\n');
  
  const userId = `debug_${Date.now()}`;
  
  // Step 1: Set brand filter
  console.log('Step 1: Set brand to BOSS');
  const r1 = await axios.post(`${API_URL}/chat`, { userId, message: 'dua kemish boss te zeze' });
  console.log(`  Products: ${r1.data.products.length}`);
  console.log(`  Unique brands: ${[...new Set(r1.data.products.map(p => p.brand))].join(', ')}`);
  console.log(`  Session lastCategory: ${r1.data.sessionContext?.lastCategory}`);
  console.log(`  Session appliedFilters:`, r1.data.sessionContext?.appliedFilters);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Step 2: Ask exploratory question
  console.log('\nStep 2: Ask "qfar kemisha keni?"');
  const r2 = await axios.post(`${API_URL}/chat`, { userId, message: 'qfar kemisha keni?' });
  console.log(`  Products: ${r2.data.products.length}`);
  console.log(`  Unique brands: ${[...new Set(r2.data.products.map(p => p.brand))].join(', ')}`);
  console.log(`  Session lastCategory: ${r2.data.sessionContext?.lastCategory}`);
  console.log(`  Session appliedFilters:`, r2.data.sessionContext?.appliedFilters);
  
  // Analysis
  const brands = [...new Set(r2.data.products.map(p => p.brand))];
  console.log('\n📊 Analysis:');
  console.log(`  Brand diversity: ${brands.length} unique brands`);
  console.log(`  Brands: ${brands.join(', ')}`);
  
  if (brands.length === 1 && brands[0] === 'BOSS') {
    console.log('\n❌ ISSUE: Brand filter NOT cleared (still showing only BOSS)');
  } else if (brands.length > 1) {
    console.log('\n✅ SUCCESS: Brand filter was cleared (showing multiple brands)');
  }
}

debugTest().catch(console.error);

