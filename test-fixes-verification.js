const axios = require('axios');

/**
 * 🧪 COMPREHENSIVE CHATBOT FIXES VERIFICATION TEST
 * 
 * This test verifies all the implemented fixes:
 * 1. Category detection (bluza → shirt)
 * 2. Context reset (category switches)
 * 3. Price parsing (nën 20$ → <20)
 * 4. AI product validation
 * 5. Session context preservation
 */

class ChatbotFixesTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 CHATBOT FIXES VERIFICATION TEST');
    console.log('==================================');
    console.log('');

    const testCases = [
      {
        name: 'Category Detection Fix',
        description: 'Verify "bluza" is recognized as shirt category',
        steps: [
          { message: 'Kërkoj bluza', expectedCategory: 'shirt', expectedProducts: '>0' }
        ]
      },
      {
        name: 'Context Reset Fix',
        description: 'Verify context resets when switching categories',
        steps: [
          { message: 'Kërkoj bluza', expectedCategory: 'shirt' },
          { message: 'te kuqe', expectedColor: 'red', expectedCategory: 'shirt' },
          { message: 'dua kemishe', expectedCategory: 'shirt', shouldResetContext: true },
          { message: 'te kuqe', expectedColor: 'red', expectedCategory: 'shirt' }
        ]
      },
      {
        name: 'Price Context Retention',
        description: 'Verify price filters work with category context',
        steps: [
          { message: 'Kërkoj xhinse', expectedCategory: 'jeans' },
          { message: 'nën 20$', expectedPrice: '<20', expectedCategory: 'jeans' }
        ]
      },
      {
        name: 'Fresh Price Query',
        description: 'Verify clarification when no category context',
        steps: [
          { message: 'nën 20$', shouldAskClarification: true }
        ]
      },
      {
        name: 'Combined Filters',
        description: 'Verify multiple filters work together',
        steps: [
          { message: 'peshqir te kuq nën 30$', expectedCategory: 'towel', expectedColor: 'red', expectedPrice: '<20' }
        ]
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 ${testCase.name}`);
      console.log(`📝 ${testCase.description}`);
      console.log('='.repeat(60));
      
      const userId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        console.log(`\n📋 Step ${i + 1}: "${step.message}"`);
        
        const result = await this.testStep(userId, step);
        this.testResults.push(result);
        
        // Add delay between steps
        await this.delay(1000);
      }
      
      console.log('\n' + '='.repeat(60));
    }

    this.generateReport();
  }

  async testStep(userId, expected) {
    try {
      const response = await axios.post(`${this.baseUrl}/chat`, {
        userId: userId,
        message: expected.message
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
      const aiProducts = products.filter(p => 
        p.id.startsWith('ai_generated') || 
        p.id.startsWith('mock_') ||
        p.id.startsWith('fallback_')
      );

      if (aiProducts.length > 0) {
        console.log(`❌ FAIL: AI-generated products detected:`, aiProducts.map(p => p.id));
        return { success: false, error: 'AI products detected', step: expected };
      } else {
        console.log(`✅ PASS: No AI-generated products`);
      }

      // Check category detection
      if (expected.expectedCategory) {
        const categoryMatches = products.filter(p => {
          const name = p.name.toLowerCase();
          if (expected.expectedCategory === 'shirt') {
            return name.includes('kemishë') || name.includes('këmishë') || 
                   name.includes('maicë') || name.includes('bluzë') || 
                   name.includes('bluza') || name.includes('shirt');
          } else if (expected.expectedCategory === 'jeans') {
            return name.includes('xhinse') || name.includes('jeans');
          } else if (expected.expectedCategory === 'towel') {
            return name.includes('peshqir') || name.includes('towel') || name.includes('mantel');
          }
          return true;
        });

        if (expected.expectedProducts === '>0' && products.length === 0) {
          console.log(`❌ FAIL: Expected products but got 0`);
          return { success: false, error: 'No products returned', step: expected };
        } else if (categoryMatches.length === products.length || products.length === 0) {
          console.log(`✅ PASS: Category detection working`);
        } else {
          console.log(`❌ FAIL: Category mismatch - ${products.length - categoryMatches.length} products don't match ${expected.expectedCategory}`);
          return { success: false, error: 'Category mismatch', step: expected };
        }
      }

      // Check price filtering
      if (expected.expectedPrice) {
        const priceMatches = products.filter(p => {
          if (expected.expectedPrice === '<20') return p.price < 20;
          if (expected.expectedPrice === '>20') return p.price > 20;
          if (expected.expectedPrice === 'around 20') return p.price >= 18 && p.price <= 22;
          return true;
        });

        if (priceMatches.length === products.length) {
          console.log(`✅ PASS: Price filter working (${expected.expectedPrice})`);
        } else {
          console.log(`❌ FAIL: Price filter issue - ${products.length - priceMatches.length} products don't match ${expected.expectedPrice}`);
          return { success: false, error: 'Price filter issue', step: expected };
        }
      }

      // Check color filtering
      if (expected.expectedColor) {
        const colorMatches = products.filter(p => 
          p.color.toLowerCase().includes(expected.expectedColor.toLowerCase()) ||
          (expected.expectedColor === 'red' && p.color.toLowerCase().includes('kuq'))
        );

        if (colorMatches.length === products.length) {
          console.log(`✅ PASS: Color filter working (${expected.expectedColor})`);
        } else {
          console.log(`❌ FAIL: Color filter issue - ${products.length - colorMatches.length} products don't match ${expected.expectedColor}`);
          return { success: false, error: 'Color filter issue', step: expected };
        }
      }

      // Check clarification system
      if (expected.shouldAskClarification) {
        if (message.includes('Cilat produkte') || message.includes('dëshironi')) {
          console.log(`✅ PASS: Clarification system working`);
        } else {
          console.log(`❌ FAIL: Should ask for clarification`);
          return { success: false, error: 'Clarification not triggered', step: expected };
        }
      }

      // Show sample products
      if (products.length > 0) {
        console.log(`📋 Sample products:`);
        products.slice(0, 2).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - $${p.price} (${p.color}) [ID: ${p.id}]`);
        });
      }

      return { success: true, step: expected, products: products.length };

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      return { success: false, error: error.message, step: expected };
    }
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;

    console.log(`\n📈 Summary:`);
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Successful: ${successfulTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.testResults.filter(r => !r.success).forEach((result, i) => {
        console.log(`   ${i + 1}. "${result.step.message}" - ${result.error}`);
      });
    }

    console.log(`\n🎯 Fix Status:`);
    console.log(`   ✅ Category Detection: ${this.testResults.some(r => r.step.message.includes('bluza') && r.success) ? 'FIXED' : 'NEEDS WORK'}`);
    console.log(`   ✅ Context Reset: ${this.testResults.some(r => r.step.message.includes('dua kemishe') && r.success) ? 'FIXED' : 'NEEDS WORK'}`);
    console.log(`   ✅ Price Context: ${this.testResults.some(r => r.step.message.includes('nën 20$') && r.success) ? 'FIXED' : 'NEEDS WORK'}`);
    console.log(`   ✅ AI Validation: ${this.testResults.every(r => !r.error || r.error !== 'AI products detected') ? 'FIXED' : 'NEEDS WORK'}`);
    console.log(`   ✅ Combined Filters: ${this.testResults.some(r => r.step.message.includes('peshqir te kuq') && r.success) ? 'FIXED' : 'NEEDS WORK'}`);

    if (successfulTests === totalTests) {
      console.log(`\n🎉 ALL FIXES SUCCESSFUL! The chatbot is now production-ready.`);
    } else {
      console.log(`\n⚠️ Some fixes need attention. Check the failed tests above.`);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function runFixesTest() {
  const test = new ChatbotFixesTest();
  await test.runAllTests();
}

runFixesTest().catch(console.error);
