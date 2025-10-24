/**
 * Test unavailable categories (kepuce, atlete)
 */

const axios = require('axios');

const API_URL = 'https://michael-kors-chatbot.onrender.com/chat';

async function test() {
  console.log('Testing unavailable categories...\n');
  
  const tests = [
    { query: 'qfar brende te kepuceve keni', desc: 'What shoe brands do you have? (genitive)' },
    { query: 'qfar atlete keni?', desc: 'What sneakers do you have?' },
    { query: 'dua atlete', desc: 'I want sneakers' },
    { query: 'dua kepuce', desc: 'I want shoes' },
    { query: 'a keni shoes?', desc: 'Do you have shoes? (English)' }
  ];
  
  for (const test of tests) {
    const sessionId = `test_${Date.now()}_${Math.random()}`;
    
    console.log(`Query: "${test.query}"`);
    console.log(`Description: ${test.desc}`);
    
    try {
      const r = await axios.post(API_URL, {
        userId: sessionId,
        message: test.query
      });
      
      console.log(`Response: ${r.data.message.substring(0, 100)}...`);
      console.log(`Products: ${r.data.products.length}`);
      
      const isGibberish = r.data.message.includes('Nuk e kuptova kërkesën tuaj');
      const showsCategoryList = r.data.message.includes('Kemi këto kategori') || 
                                r.data.message.includes('kemishe') ||
                                r.data.message.includes('pantallona');
      
      if (isGibberish) {
        console.log('❌ Treated as GIBBERISH (wrong!)');
      } else if (showsCategoryList) {
        console.log('✓ Shows category list (correct!)');
      } else {
        console.log('⚠️  Other response');
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
  }
}

test().catch(e => console.error('Fatal error:', e.message));

