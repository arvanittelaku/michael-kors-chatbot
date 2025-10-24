/**
 * Test if "silver" alone works
 */

const axios = require('axios');

async function test() {
  const API_URL = 'https://michael-kors-chatbot.onrender.com/chat';
  
  const tests = [
    { session: `test1_${Date.now()}`, messages: ['pantallona', 'silver'] },
    { session: `test2_${Date.now()}`, messages: ['pantallona', 'argjend'] },  // Albanian word for silver
    { session: `test3_${Date.now()}`, messages: ['pantallona', 'te argjendtë'] },  // "of silver" in Albanian
  ];
  
  for (const test of tests) {
    console.log(`\n=== Test: ${test.messages.join(' → ')} ===`);
    
    let lastResult;
    for (const msg of test.messages) {
      console.log(`Query: "${msg}"`);
      const r = await axios.post(API_URL, {
        userId: test.session,
        message: msg
      });
      console.log(`  Products: ${r.data.products.length}`);
      console.log(`  Filters: ${JSON.stringify(r.data.sessionContext.appliedFilters)}`);
      lastResult = r.data;
    }
    
    if (lastResult.products.length > 0) {
      const colors = [...new Set(lastResult.products.map(p => p.color))];
      console.log(`  Colors: ${colors.join(', ')}`);
    }
  }
}

test().catch(e => console.error('Error:', e.message));

