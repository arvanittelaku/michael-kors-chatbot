const axios = require('axios');

async function testPriceContextRetention() {
  console.log('🧪 TESTING PRICE-CONTEXT RETENTION SYSTEM');
  console.log('==========================================');
  
  const testCases = [
    {
      name: 'Category remembered correctly',
      steps: [
        { message: 'Kërkoj xhinse', expectedProducts: true, expectedCategory: 'jeans' },
        { message: 'nën 20$', expectedProducts: true, expectedCategory: 'jeans', expectedPriceFilter: true }
      ]
    },
    {
      name: 'Clarification when missing context',
      steps: [
        { message: 'nën 20$', expectedProducts: false, expectedClarification: true }
      ]
    },
    {
      name: 'Combined filters',
      steps: [
        { message: 'peshqir te kuq nën 30€', expectedProducts: true, expectedCategory: 'towel', expectedColor: 'red', expectedPriceFilter: true }
      ]
    },
    {
      name: 'Context switching',
      steps: [
        { message: 'Kërkoj bluza', expectedProducts: true, expectedCategory: 'shirt' },
        { message: 'nën 40€', expectedProducts: true, expectedCategory: 'shirt', expectedPriceFilter: true },
        { message: 'xhinse nën 25€', expectedProducts: true, expectedCategory: 'jeans', expectedPriceFilter: true }
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log('='.repeat(50));
    
    let userId = `test_${Date.now()}`;
    
    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      console.log(`\nStep ${i + 1}: "${step.message}"`);
      
      try {
        const response = await axios.post('http://localhost:5000/chat', {
          userId: userId,
          message: step.message
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const products = response.data.products || [];
        const message = response.data.message || '';
        
        console.log(`Products returned: ${products.length}`);
        console.log(`Message: ${message.substring(0, 100)}...`);
        
        // Check expectations
        if (step.expectedProducts) {
          if (products.length > 0) {
            console.log('✅ PASS: Products returned');
            
            // Check category
            if (step.expectedCategory) {
              const categoryMatches = products.filter(p => {
                const name = p.name.toLowerCase();
                if (step.expectedCategory === 'jeans') {
                  return name.includes('xhinse') || name.includes('jeans');
                } else if (step.expectedCategory === 'towel') {
                  return name.includes('peshqir') || name.includes('towel') || name.includes('mantel');
                } else if (step.expectedCategory === 'shirt') {
                  return name.includes('kemishë') || name.includes('këmishë') || name.includes('maicë') || name.includes('bluzë');
                }
                return true;
              });
              
              if (categoryMatches.length === products.length) {
                console.log(`✅ PASS: All products match expected category (${step.expectedCategory})`);
              } else {
                console.log(`❌ FAIL: Wrong category products:`, products.filter(p => !categoryMatches.includes(p)).map(p => p.name));
              }
            }
            
            // Check color
            if (step.expectedColor) {
              const colorMatches = products.filter(p => 
                p.color.toLowerCase().includes(step.expectedColor.toLowerCase()) ||
                (step.expectedColor === 'red' && p.color.toLowerCase().includes('kuq'))
              );
              
              if (colorMatches.length === products.length) {
                console.log(`✅ PASS: All products match expected color (${step.expectedColor})`);
              } else {
                console.log(`❌ FAIL: Wrong color products:`, products.filter(p => !colorMatches.includes(p)).map(p => `${p.name} (${p.color})`));
              }
            }
            
            // Check price filter
            if (step.expectedPriceFilter) {
              const priceMatches = products.filter(p => p.price < 20);
              
              if (priceMatches.length === products.length) {
                console.log('✅ PASS: All products under expected price');
              } else {
                console.log('❌ FAIL: Products over price limit:', products.filter(p => p.price >= 20).map(p => `${p.name} ($${p.price})`));
              }
            }
            
            // Show sample products
            if (products.length > 0) {
              console.log('Sample products:');
              products.slice(0, 3).forEach((p, idx) => {
                console.log(`  ${idx + 1}. ${p.name} - $${p.price} (${p.color})`);
              });
            }
            
          } else {
            console.log('❌ FAIL: Expected products but got none');
          }
        } else if (step.expectedClarification) {
          if (message.includes('Cilat produkte') || message.includes('dëshironi')) {
            console.log('✅ PASS: Clarification message returned');
          } else {
            console.log('❌ FAIL: Expected clarification but got:', message);
          }
        }
        
      } catch (error) {
        console.log('❌ ERROR:', error.message);
      }
    }
  }
}

testPriceContextRetention();
