const axios = require('axios');

async function comprehensiveTest() {
  console.log('🧪 COMPREHENSIVE CHATBOT TESTING');
  console.log('==================================');
  
  const testCases = [
    {
      name: 'Basic towel request',
      query: 'Kam nevojë për peshqir',
      expectedCategory: 'towel',
      shouldHaveProducts: true
    },
    {
      name: 'Red towel follow-up',
      query: 'te kuq',
      expectedCategory: 'towel',
      expectedColor: 'red',
      shouldHaveProducts: true
    },
    {
      name: 'Jeans request',
      query: 'xhinse',
      expectedCategory: 'jeans',
      shouldHaveProducts: true
    },
    {
      name: 'Jeans under $20',
      query: 'nen 20$',
      expectedCategory: 'jeans',
      expectedMaxPrice: 20,
      shouldHaveProducts: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedCategory}${testCase.expectedColor ? ` (${testCase.expectedColor})` : ''}${testCase.expectedMaxPrice ? ` under $${testCase.expectedMaxPrice}` : ''}`);
    
    try {
      const response = await axios.post('http://localhost:5000/chat', {
        userId: 'comprehensive_test',
        message: testCase.query
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      const products = response.data.products || [];
      console.log(`Products returned: ${products.length}`);

      if (products.length > 0) {
        // Check for mock products
        const mockProducts = products.filter(p => 
          p.id.startsWith('ai_generated_') || 
          p.id.startsWith('mock_') ||
          p.name.includes('Bluza e Bardhë') ||
          p.name.includes('Fustan i Zi') ||
          p.name.includes('Pantallona Xhinse')
        );
        
        if (mockProducts.length > 0) {
          console.log('❌ FAIL: Mock products detected:', mockProducts.map(p => p.name));
        } else {
          console.log('✅ PASS: No mock products');
        }

        // Check category filtering
        if (testCase.expectedCategory) {
          const categoryMatches = products.filter(p => {
            const name = p.name.toLowerCase();
            if (testCase.expectedCategory === 'towel') {
              return name.includes('peshqir') || name.includes('towel') || name.includes('mantel');
            } else if (testCase.expectedCategory === 'jeans') {
              return name.includes('xhinse') || name.includes('jeans');
            }
            return true;
          });
          
          if (categoryMatches.length === products.length) {
            console.log('✅ PASS: All products match expected category');
          } else {
            console.log('❌ FAIL: Wrong category products:', products.filter(p => !categoryMatches.includes(p)).map(p => p.name));
          }
        }

        // Check color filtering
        if (testCase.expectedColor) {
          const colorMatches = products.filter(p => 
            p.color.toLowerCase().includes(testCase.expectedColor.toLowerCase()) ||
            p.color.toLowerCase().includes('kuq') // Albanian for red
          );
          
          if (colorMatches.length === products.length) {
            console.log('✅ PASS: All products match expected color');
          } else {
            console.log('❌ FAIL: Wrong color products:', products.filter(p => !colorMatches.includes(p)).map(p => `${p.name} (${p.color})`));
          }
        }

        // Check price filtering
        if (testCase.expectedMaxPrice) {
          const priceMatches = products.filter(p => p.price < testCase.expectedMaxPrice);
          
          if (priceMatches.length === products.length) {
            console.log('✅ PASS: All products under expected price');
          } else {
            console.log('❌ FAIL: Products over price limit:', products.filter(p => p.price >= testCase.expectedMaxPrice).map(p => `${p.name} ($${p.price})`));
          }
        }

        // Show sample products
        console.log('Sample products:');
        products.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i+1}. ${p.name} - $${p.price} (${p.color}) [ID: ${p.id}]`);
        });

      } else {
        console.log('⚠️ No products returned');
        if (testCase.shouldHaveProducts) {
          console.log('❌ FAIL: Expected products but got none');
        } else {
          console.log('✅ PASS: Expected no products');
        }
      }

    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
}

comprehensiveTest();
