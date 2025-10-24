/**
 * Verify if the issue is dataset limitation or logic bug
 */

const axios = require('axios');
const API_URL = 'https://michael-kors-chatbot.onrender.com';

async function verifyBrands() {
  console.log('🔍 VERIFICATION: Testing with pants (multiple brands confirmed)\n');
  
  const userId = `verify_${Date.now()}`;
  
  // Test with pants - we KNOW there are BOSS and TOM TAILOR
  console.log('Step 1: Filter by brand TOM TAILOR');
  const r1 = await axios.post(`${API_URL}/chat`, { userId, message: 'dua pantolla te tom tailor' });
  console.log(`  Products: ${r1.data.products.length}`);
  console.log(`  Brands: ${[...new Set(r1.data.products.map(p => p.brand))].join(', ')}`);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('\nStep 2: Ask exploratory "qfar pantollash keni?"');
  const r2 = await axios.post(`${API_URL}/chat`, { userId, message: 'qfar pantollash keni?' });
  console.log(`  Products: ${r2.data.products.length}`);
  const brands = [...new Set(r2.data.products.map(p => p.brand))];
  console.log(`  Brands: ${brands.join(', ')}`);
  console.log(`  Brand count: ${brands.length}`);
  
  // Check results
  console.log('\n📊 Result:');
  if (brands.length > 1) {
    console.log(`✅ SUCCESS: Exploratory query cleared brand filter (${brands.length} brands found)`);
    return true;
  } else {
    console.log(`❌ FAILED: Still showing only ${brands[0]}`);
    return false;
  }
}

verifyBrands().catch(console.error);

