/**
 * 🧪 CRITICAL FIXES VERIFICATION TEST
 * Tests the specific issues identified in the user's conversation
 */

const axios = require('axios');

const CHATBOT_URL = 'http://localhost:5000/chat';

async function testCriticalFixes() {
  console.log('🧪 CRITICAL FIXES VERIFICATION TEST');
  console.log('===================================');
  console.log('');

  const testCases = [
    {
      name: 'Test 1: Basic Category Detection',
      steps: [
        { message: 'Kërkoj kemishe', expectedCategory: 'shirt', description: 'Should return only real shirts' }
      ]
    },
    {
      name: 'Test 2: Context Preservation',
      steps: [
        { message: 'Kërkoj kemishe', expectedCategory: 'shirt' },
        { message: 'te zeze nen 20$', expectedCategory: 'shirt', expectedColor: 'black', expectedPrice: '<20', description: 'Should maintain shirt context' }
      ]
    },
    {
      name: 'Test 3: Context Switching Issue',
      steps: [
        { message: 'Kërkoj kemishe', expectedCategory: 'shirt' },
        { message: 'te zeze nen 20$', expectedCategory: 'shirt', expectedColor: 'black', expectedPrice: '<20' },
        { message: 'ngjyre te kuqe', expectedCategory: 'shirt', expectedColor: 'red', description: 'Should STAY in shirt context, not switch to towels' }
      ]
    },
    {
      name: 'Test 4: AI Product Generation Check',
      steps: [
        { message: 'Kërkoj kemishe', expectNoAIProducts: true, description: 'Should have NO AI-generated products' }
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 ${testCase.name}`);
    console.log('='.repeat(50));
    
    const userId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    for (let i = 0; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];
      console.log(`\n📋 Step ${i + 1}: "${step.message}"`);
      
      try {
        const response = await axios.post(CHATBOT_URL, { 
          userId: userId, 
          message: step.message 
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const products = response.data.products || [];
        const message = response.data.message || '';

        console.log(`✅ Response received:`);
        console.log(`   Products: ${products.length}`);
        console.log(`   Message length: ${message.length} chars`);

        // Check for AI-generated products
        if (step.expectNoAIProducts) {
          const aiProducts = products.filter(p => 
            p.id.startsWith('ai_generated') || 
            p.id.startsWith('mock_') ||
            p.id.startsWith('fallback_') ||
            p.id.includes('generated') ||
            p.id.includes('mock')
          );
          
          if (aiProducts.length > 0) {
            console.log(`❌ FAIL: AI-generated products detected:`, aiProducts.map(p => p.id));
          } else {
            console.log(`✅ PASS: No AI-generated products`);
          }
        }

        // Check category consistency
        if (step.expectedCategory) {
          const categoryMatches = products.filter(p => {
            const name = p.name.toLowerCase();
            if (step.expectedCategory === 'shirt') {
              return name.includes('kemishë') || name.includes('këmishë') || 
                     name.includes('maicë') || name.includes('bluzë') || 
                     name.includes('bluza') || name.includes('shirt');
            }
            return true;
          });

          if (products.length > 0 && categoryMatches.length !== products.length) {
            console.log(`❌ FAIL: Category mismatch - ${products.length - categoryMatches.length} products don't match ${step.expectedCategory}`);
          } else {
            console.log(`✅ PASS: Category consistency maintained`);
          }
        }

        // Check color filtering
        if (step.expectedColor) {
          const colorMatches = products.filter(p => 
            p.color.toLowerCase().includes(step.expectedColor.toLowerCase()) ||
            (step.expectedColor === 'red' && p.color.toLowerCase().includes('kuq')) ||
            (step.expectedColor === 'black' && p.color.toLowerCase().includes('zeze'))
          );

          if (products.length > 0 && colorMatches.length !== products.length) {
            console.log(`❌ FAIL: Color mismatch - ${products.length - colorMatches.length} products don't match ${step.expectedColor}`);
          } else {
            console.log(`✅ PASS: Color filter working`);
          }
        }

        // Check price filtering
        if (step.expectedPrice) {
          const priceMatches = products.filter(p => {
            if (step.expectedPrice === '<20') return p.price < 20;
            if (step.expectedPrice === '>20') return p.price > 20;
            if (step.expectedPrice === 'around 20') return p.price >= 18 && p.price <= 22;
            return true;
          });

          if (products.length > 0 && priceMatches.length !== products.length) {
            console.log(`❌ FAIL: Price mismatch - ${products.length - priceMatches.length} products don't match ${step.expectedPrice}`);
          } else {
            console.log(`✅ PASS: Price filter working`);
          }
        }

        // Show sample products
        if (products.length > 0) {
          console.log(`📋 Sample products:`);
          products.slice(0, 3).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name} - $${p.price} (${p.color}) [ID: ${p.id}]`);
          });
        }

        // Check for duplicates
        const uniqueIds = [...new Set(products.map(p => p.id))];
        if (uniqueIds.length !== products.length) {
          console.log(`❌ FAIL: Duplicate products detected: ${products.length - uniqueIds.length} duplicates`);
        } else {
          console.log(`✅ PASS: No duplicate products`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n🎯 SUMMARY:');
  console.log('The fixes should ensure:');
  console.log('✅ No AI-generated products');
  console.log('✅ Context preservation (shirt → shirt, not shirt → towel)');
  console.log('✅ No duplicate products');
  console.log('✅ Only real Trieve dataset products');
}

testCriticalFixes().catch(console.error);
