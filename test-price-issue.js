const axios = require('axios');

async function testPriceIssue() {
  console.log('🔍 Testing Price Filtering Issue');
  console.log('================================');
  
  try {
    // Test 1: Check if there are any jeans under $20 in the dataset
    console.log('\n1️⃣ Testing: "xhinse" (all jeans)');
    const response1 = await axios.post('http://localhost:5000/chat', {
      userId: 'price_test',
      message: 'xhinse'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const allJeans = response1.data.products || [];
    console.log(`Total jeans found: ${allJeans.length}`);
    
    const jeansUnder20 = allJeans.filter(p => p.price < 20);
    console.log(`Jeans under $20: ${jeansUnder20.length}`);
    
    if (jeansUnder20.length > 0) {
      console.log('Jeans under $20:');
      jeansUnder20.forEach(p => {
        console.log(`  - ${p.name}: $${p.price}`);
      });
    } else {
      console.log('❌ No jeans under $20 found in dataset');
    }

    // Test 2: Check price parsing
    console.log('\n2️⃣ Testing: "nen 20$" (price filter)');
    const response2 = await axios.post('http://localhost:5000/chat', {
      userId: 'price_test',
      message: 'nen 20$'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const filteredProducts = response2.data.products || [];
    console.log(`Products returned for "nen 20$": ${filteredProducts.length}`);
    
    if (filteredProducts.length > 0) {
      console.log('Products found:');
      filteredProducts.forEach(p => {
        console.log(`  - ${p.name}: $${p.price}`);
      });
    } else {
      console.log('❌ No products returned for price filter');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testPriceIssue();
