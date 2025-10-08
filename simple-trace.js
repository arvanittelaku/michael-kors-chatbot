const axios = require('axios');

async function traceDataFlow() {
  console.log('🔍 CHATBOT DATA FLOW TRACE');
  console.log('==========================');
  
  try {
    // Test 1: Basic category detection
    console.log('\n📝 Test 1: "Kërkoj xhinse"');
    const response1 = await axios.post('http://localhost:5000/chat', {
      userId: 'trace_test',
      message: 'Kërkoj xhinse'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('✅ Response received:');
    console.log('  Products:', response1.data.products.length);
    console.log('  Message length:', response1.data.message.length);
    console.log('  First product:', response1.data.products[0] ? {
      id: response1.data.products[0].id,
      name: response1.data.products[0].name,
      price: response1.data.products[0].price
    } : 'None');

    // Test 2: Category detection issue
    console.log('\n📝 Test 2: "Kërkoj bluza"');
    const response2 = await axios.post('http://localhost:5000/chat', {
      userId: 'trace_test_2',
      message: 'Kërkoj bluza'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('✅ Response received:');
    console.log('  Products:', response2.data.products.length);
    console.log('  Message length:', response2.data.message.length);
    console.log('  First product:', response2.data.products[0] ? {
      id: response2.data.products[0].id,
      name: response2.data.products[0].name,
      price: response2.data.products[0].price
    } : 'None');

    // Test 3: Price context retention
    console.log('\n📝 Test 3: "nën 20$" (with context)');
    const response3 = await axios.post('http://localhost:5000/chat', {
      userId: 'trace_test',
      message: 'nën 20$'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('✅ Response received:');
    console.log('  Products:', response3.data.products.length);
    console.log('  Message length:', response3.data.message.length);
    console.log('  Products under $20:', response3.data.products.filter(p => p.price < 20).length);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

traceDataFlow();
