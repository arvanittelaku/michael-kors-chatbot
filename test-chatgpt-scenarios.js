/**
 * Test suite for ChatGPT's reported issues
 * Testing normalization, context merging, and multi-turn behavior
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_SESSION_ID = `test_session_${Date.now()}`;

// Helper to send message and display response
async function testMessage(message, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Test: ${description}`);
  console.log(`💬 User: "${message}"`);
  console.log('-'.repeat(80));
  
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      userId: TEST_SESSION_ID,
      message: message
    });
    
    const { message: botMessage, products } = response.data;
    
    console.log(`🤖 Bot: "${botMessage}"`);
    console.log(`📦 Products returned: ${products.length}`);
    
    if (products.length > 0) {
      console.log(`\n📊 Sample products (first 3):`);
      products.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      Price: $${p.price} | Brand: ${p.brand} | Color: ${p.color} | Size: ${p.size}`);
      });
    }
    
    return { success: true, products, botMessage };
  } catch (error) {
    console.error(`❌ Error:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`\n${'#'.repeat(80)}`);
  console.log(`# CHATGPT SYSTEMATIC FIX VERIFICATION SUITE`);
  console.log(`# Session ID: ${TEST_SESSION_ID}`);
  console.log(`# API URL: ${API_URL}`);
  console.log(`${'#'.repeat(80)}\n`);
  
  // ============================================================================
  // SCENARIO 1: Multi-turn context with size filter
  // This should preserve category + brand + color when adding size
  // ============================================================================
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█ SCENARIO 1: Multi-turn context preservation (CRITICAL BUG)`);
  console.log(`█ Expected: Filters should accumulate, not replace`);
  console.log(`${'█'.repeat(80)}`);
  
  await testMessage(
    'kemish',
    'Turn 1: Request shirts (exploratory)'
  );
  
  await testMessage(
    'dua nje kemishe te zeze brand boss nen 20$',
    'Turn 2: Add filters (black + BOSS + under $20)'
  );
  
  const result3 = await testMessage(
    'dua nje kemishe te zeze madhsine xs',
    'Turn 3: Add size XS (should keep category + black)'
  );
  
  // Verify filters were preserved
  if (result3.success && result3.products.length > 0) {
    const allBlack = result3.products.every(p => p.color === 'BLACK');
    const allXS = result3.products.every(p => p.size === 'XS' || p.size === 'xs');
    console.log(`\n✅ Verification:`);
    console.log(`   - All products black: ${allBlack ? '✅' : '❌'}`);
    console.log(`   - All products XS: ${allXS ? '✅' : '❌'}`);
  } else if (result3.success && result3.products.length === 0) {
    // Check if the bot gave helpful feedback
    const hasHelpfulMessage = result3.botMessage.includes('disponueshme') || 
                             result3.botMessage.includes('Gjeta');
    console.log(`\n⚠️ No products found, but helpful message: ${hasHelpfulMessage ? '✅' : '❌'}`);
  }
  
  await testMessage(
    'dua nje kemish madhsi 44',
    'Turn 4: Change size to 44 (typo: "madhsi", should keep category)'
  );
  
  // ============================================================================
  // SCENARIO 2: Typo tolerance
  // ============================================================================
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█ SCENARIO 2: Typo tolerance`);
  console.log(`${'█'.repeat(80)}`);
  
  const newSessionId = `test_session_${Date.now()}_2`;
  
  await testMessage(
    'kamnevoje per kemisha',
    'Typo 1: "kamnevoje" (missing space)'
  );
  
  await testMessage(
    'ngjyr e zeze',
    'Typo 2: "ngjyr" (missing "a")'
  );
  
  await testMessage(
    'me te lira',
    'Sorting: cheaper (should sort by price ASC)'
  );
  
  // ============================================================================
  // SCENARIO 3: Size normalization
  // ============================================================================
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█ SCENARIO 3: Size normalization (xs vs XS)`);
  console.log(`${'█'.repeat(80)}`);
  
  await testMessage(
    'kemishe madhsine xs',
    'Lowercase "xs" should match uppercase "XS" in database'
  );
  
  // ============================================================================
  // SCENARIO 4: Exploratory query
  // ============================================================================
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█ SCENARIO 4: Exploratory query clearing filters`);
  console.log(`${'█'.repeat(80)}`);
  
  await testMessage(
    'kemishe te zeze',
    'Filter: black shirts'
  );
  
  await testMessage(
    'qfar kemisha keni',
    'Exploratory: "what shirts do you have?" (should clear color filter)'
  );
  
  console.log(`\n${'█'.repeat(80)}`);
  console.log(`█ ALL TESTS COMPLETED`);
  console.log(`${'█'.repeat(80)}\n`);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});

