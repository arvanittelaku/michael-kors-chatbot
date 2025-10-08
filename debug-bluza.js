const axios = require('axios');

async function debugBluzaIssue() {
  console.log('🔍 DEBUGGING BLUZA ISSUE');
  console.log('========================');
  
  try {
    // Test 1: Check what Trieve returns for "bluza"
    console.log('\n📝 Test 1: "Kërkoj bluza"');
    const response1 = await axios.post('http://localhost:5000/chat', {
      userId: 'debug_test',
      message: 'Kërkoj bluza'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('Response:', {
      products: response1.data.products.length,
      message: response1.data.message.substring(0, 100) + '...'
    });

    if (response1.data.products.length > 0) {
      console.log('Products returned:');
      response1.data.products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - $${p.price} (${p.color}) [ID: ${p.id}]`);
      });
    }

    // Test 2: Check what happens with "kemishe" (should work)
    console.log('\n📝 Test 2: "Kërkoj kemishe"');
    const response2 = await axios.post('http://localhost:5000/chat', {
      userId: 'debug_test_2',
      message: 'Kërkoj kemishe'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('Response:', {
      products: response2.data.products.length,
      message: response2.data.message.substring(0, 100) + '...'
    });

    if (response2.data.products.length > 0) {
      console.log('Products returned:');
      response2.data.products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - $${p.price} (${p.color}) [ID: ${p.id}]`);
      });
    }

    // Test 3: Check what happens with "maicë" (should work)
    console.log('\n📝 Test 3: "Kërkoj maicë"');
    const response3 = await axios.post('http://localhost:5000/chat', {
      userId: 'debug_test_3',
      message: 'Kërkoj maicë'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    console.log('Response:', {
      products: response3.data.products.length,
      message: response3.data.message.substring(0, 100) + '...'
    });

    if (response3.data.products.length > 0) {
      console.log('Products returned:');
      response3.data.products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - $${p.price} (${p.color}) [ID: ${p.id}]`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugBluzaIssue();
