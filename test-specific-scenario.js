const axios = require('axios');

async function testSpecificScenario() {
  console.log('🎯 TESTING SPECIFIC PRICE-CONTEXT SCENARIO');
  console.log('==========================================');
  
  try {
    // Test the exact scenario from the user's request
    console.log('\n1️⃣ Step 1: "Kërkoj xhinse"');
    const response1 = await axios.post('http://localhost:5000/chat', {
      userId: 'final_test',
      message: 'Kërkoj xhinse'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const jeans = response1.data.products || [];
    console.log(`✅ Jeans returned: ${jeans.length}`);
    
    if (jeans.length > 0) {
      console.log('Sample jeans:');
      jeans.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} - $${p.price}`);
      });
    }

    console.log('\n2️⃣ Step 2: "nën 20$" (should use jeans context)');
    const response2 = await axios.post('http://localhost:5000/chat', {
      userId: 'final_test',
      message: 'nën 20$'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const filteredJeans = response2.data.products || [];
    const message = response2.data.message || '';
    
    console.log(`Products returned: ${filteredJeans.length}`);
    console.log(`Message: ${message.substring(0, 150)}...`);
    
    if (filteredJeans.length > 0) {
      console.log('✅ SUCCESS: Jeans under $20 returned!');
      console.log('Jeans under $20:');
      filteredJeans.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} - $${p.price}`);
      });
      
      // Verify all are under $20
      const allUnder20 = filteredJeans.every(p => p.price < 20);
      if (allUnder20) {
        console.log('✅ VERIFIED: All products are under $20');
      } else {
        console.log('❌ ERROR: Some products are not under $20');
      }
    } else {
      console.log('❌ FAILED: No products returned');
    }

    console.log('\n3️⃣ Step 3: Fresh context test - "nën 20$" (should ask for clarification)');
    const response3 = await axios.post('http://localhost:5000/chat', {
      userId: 'fresh_test',
      message: 'nën 20$'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const clarificationProducts = response3.data.products || [];
    const clarificationMessage = response3.data.message || '';
    
    console.log(`Products returned: ${clarificationProducts.length}`);
    console.log(`Message: ${clarificationMessage}`);
    
    if (clarificationMessage.includes('Cilat produkte') || clarificationMessage.includes('dëshironi')) {
      console.log('✅ SUCCESS: Clarification message returned');
    } else {
      console.log('❌ FAILED: Expected clarification message');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testSpecificScenario();
