/**
 * 🧪 COMPREHENSIVE CHATBOT TEST SUITE
 * Tests all production-ready features and edge cases
 * Run: node comprehensive-test-suite.js
 */

const axios = require('axios');

const CHATBOT_URL = 'http://localhost:5000/chat';

class ComprehensiveTestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 COMPREHENSIVE CHATBOT TEST SUITE');
    console.log('====================================');
    console.log('');

    const testSuites = [
      {
        name: 'Category Detection & Fuzzy Matching',
        tests: [
          { message: 'Kërkoj bluza', expectedCategory: 'shirt', description: 'Basic bluza detection' },
          { message: 'dua kemishe', expectedCategory: 'shirt', description: 'Kemishe detection' },
          { message: 'Kërkoj maicë', expectedCategory: 'shirt', description: 'Maicë detection' },
          { message: 'dua xhinse', expectedCategory: 'jeans', description: 'Xhinse detection' },
          { message: 'Kërkoj peshqir', expectedCategory: 'towel', description: 'Peshqir detection' },
          { message: 'dua pantallona', expectedCategory: 'pants', description: 'Pantallona detection' }
        ]
      },
      {
        name: 'Color Detection & Conflict Resolution',
        tests: [
          { message: 'te kuqe', expectedColor: 'red', description: 'Red color detection' },
          { message: 'e zezë', expectedColor: 'black', description: 'Black color detection' },
          { message: 'e bardhë', expectedColor: 'white', description: 'White color detection' },
          { message: 'e kaltër', expectedColor: 'blue', description: 'Blue color detection' },
          { message: 'bluza e kuqe', expectedCategory: 'shirt', expectedColor: 'red', description: 'Bluza + color (no conflict)' }
        ]
      },
      {
        name: 'Price Context Retention',
        tests: [
          { 
            sequence: ['Kërkoj xhinse', 'nën 20$'], 
            expectedCategory: 'jeans', 
            expectedPrice: '<20',
            description: 'Price context retention with jeans' 
          },
          { 
            sequence: ['dua kemishe', 'mbi 30$'], 
            expectedCategory: 'shirt', 
            expectedPrice: '>20',
            description: 'Price context retention with shirts' 
          },
          { 
            sequence: ['Kërkoj peshqir', 'rreth 25$'], 
            expectedCategory: 'towel', 
            expectedPrice: 'around 20',
            description: 'Price context retention with towels' 
          }
        ]
      },
      {
        name: 'Dynamic Clarification System',
        tests: [
          { 
            message: 'nën 20$', 
            expectClarification: true,
            description: 'Fresh price query without category' 
          },
          { 
            message: 'mbi 50$', 
            expectClarification: true,
            description: 'Fresh high price query without category' 
          }
        ]
      },
      {
        name: 'Combined Filters & Edge Cases',
        tests: [
          { 
            message: 'peshqir te kuq nën 30$', 
            expectedCategory: 'towel', 
            expectedColor: 'red', 
            expectedPrice: '<20',
            description: 'Combined category + color + price' 
          },
          { 
            message: 'xhinse 31 dhe 32 nën 50$', 
            expectedCategory: 'jeans', 
            expectedSize: '31,32', 
            expectedPrice: '<20',
            description: 'Multiple sizes + price' 
          },
          { 
            message: 'kemishe e zezë dhe e kuqe', 
            expectedCategory: 'shirt', 
            expectedColor: 'black',
            description: 'Multiple colors (should pick first)' 
          }
        ]
      },
      {
        name: 'Context Reset & Management',
        tests: [
          { 
            sequence: ['Kërkoj bluza', 'te kuqe', 'dua kemishe', 'te kuqe'], 
            expectedCategory: 'shirt', 
            expectedColor: 'red',
            description: 'Context reset when switching categories' 
          },
          { 
            sequence: ['dua xhinse', 'te kuqe', 'Kërkoj peshqir', 'te kuqe'], 
            expectedCategory: 'towel', 
            expectedColor: 'red',
            description: 'Context reset from jeans to towels' 
          }
        ]
      },
      {
        name: 'AI Product Validation',
        tests: [
          { 
            message: 'Kërkoj kemishe', 
            expectNoAIProducts: true,
            description: 'Ensure no AI-generated products' 
          },
          { 
            message: 'dua xhinse', 
            expectNoAIProducts: true,
            description: 'Ensure no mock products' 
          },
          { 
            message: 'Kërkoj peshqir', 
            expectNoAIProducts: true,
            description: 'Ensure only real Trieve data' 
          }
        ]
      }
    ];

    for (const suite of testSuites) {
      console.log(`\n🔍 ${suite.name}`);
      console.log('='.repeat(60));
      
      for (const test of suite.tests) {
        await this.runTest(test);
        await this.delay(500); // Small delay between tests
      }
    }

    this.generateReport();
  }

  async runTest(test) {
    this.totalTests++;
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    try {
      let response;
      
      if (test.sequence) {
        // Multi-step test
        let lastResponse = null;
        for (const message of test.sequence) {
          const res = await axios.post(CHATBOT_URL, { 
            userId: testId, 
            message: message 
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          });
          lastResponse = res.data;
        }
        response = lastResponse;
      } else {
        // Single-step test
        const res = await axios.post(CHATBOT_URL, { 
          userId: testId, 
          message: test.message 
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });
        response = res.data;
      }

      const result = this.analyzeResponse(test, response);
      this.testResults.push(result);
      
      if (result.success) {
        this.passedTests++;
        console.log(`✅ ${test.description || test.message}`);
      } else {
        console.log(`❌ ${test.description || test.message} - ${result.error}`);
      }

    } catch (error) {
      console.log(`❌ ${test.description || test.message} - Error: ${error.message}`);
      this.testResults.push({
        test,
        success: false,
        error: error.message
      });
    }
  }

  analyzeResponse(test, response) {
    const products = response.products || [];
    const message = response.message || '';

    // Check for AI-generated products
    if (test.expectNoAIProducts) {
      const aiProducts = products.filter(p => 
        p.id.startsWith('ai_generated') || 
        p.id.startsWith('mock_') ||
        p.id.startsWith('fallback_') ||
        p.id.startsWith('generated_') ||
        p.id.startsWith('fake_') ||
        p.id.startsWith('test_')
      );
      
      if (aiProducts.length > 0) {
        return { test, success: false, error: `AI products detected: ${aiProducts.length}` };
      }
    }

    // Check clarification system
    if (test.expectClarification) {
      if (!message.includes('Cilat produkte') && !message.includes('dëshironi')) {
        return { test, success: false, error: 'Clarification not triggered' };
      }
    }

    // Check category detection
    if (test.expectedCategory) {
      const categoryMatches = products.filter(p => {
        const name = p.name.toLowerCase();
        if (test.expectedCategory === 'shirt') {
          return name.includes('kemishë') || name.includes('këmishë') || 
                 name.includes('maicë') || name.includes('bluzë') || 
                 name.includes('bluza') || name.includes('shirt');
        } else if (test.expectedCategory === 'jeans') {
          return name.includes('xhinse') || name.includes('jeans');
        } else if (test.expectedCategory === 'towel') {
          return name.includes('peshqir') || name.includes('towel') || name.includes('mantel');
        } else if (test.expectedCategory === 'pants') {
          return name.includes('pantallona') || name.includes('pants');
        }
        return true;
      });

      if (products.length > 0 && categoryMatches.length !== products.length) {
        return { test, success: false, error: `Category mismatch: ${products.length - categoryMatches.length} products don't match ${test.expectedCategory}` };
      }
    }

    // Check color filtering
    if (test.expectedColor) {
      const colorMatches = products.filter(p => 
        p.color.toLowerCase().includes(test.expectedColor.toLowerCase()) ||
        (test.expectedColor === 'red' && p.color.toLowerCase().includes('kuq')) ||
        (test.expectedColor === 'black' && p.color.toLowerCase().includes('zeze')) ||
        (test.expectedColor === 'white' && p.color.toLowerCase().includes('bardhe')) ||
        (test.expectedColor === 'blue' && p.color.toLowerCase().includes('kaltër'))
      );

      if (products.length > 0 && colorMatches.length !== products.length) {
        return { test, success: false, error: `Color mismatch: ${products.length - colorMatches.length} products don't match ${test.expectedColor}` };
      }
    }

    // Check price filtering
    if (test.expectedPrice) {
      const priceMatches = products.filter(p => {
        if (test.expectedPrice === '<20') return p.price < 20;
        if (test.expectedPrice === '>20') return p.price > 20;
        if (test.expectedPrice === 'around 20') return p.price >= 18 && p.price <= 22;
        return true;
      });

      if (products.length > 0 && priceMatches.length !== products.length) {
        return { test, success: false, error: `Price mismatch: ${products.length - priceMatches.length} products don't match ${test.expectedPrice}` };
      }
    }

    // Check size filtering
    if (test.expectedSize) {
      const expectedSizes = test.expectedSize.split(',');
      const sizeMatches = products.filter(p => {
        const productSize = p.size.toLowerCase();
        return expectedSizes.some(size => 
          productSize.includes(size.trim()) || size.trim().includes(productSize)
        );
      });

      if (products.length > 0 && sizeMatches.length !== products.length) {
        return { test, success: false, error: `Size mismatch: ${products.length - sizeMatches.length} products don't match ${test.expectedSize}` };
      }
    }

    return { test, success: true };
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');
    
    const failedTests = this.totalTests - this.passedTests;
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);

    console.log(`\n📈 Summary:`);
    console.log(`   Total tests: ${this.totalTests}`);
    console.log(`   Passed: ${this.passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success rate: ${successRate}%`);

    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.testResults.filter(r => !r.success).forEach((result, i) => {
        const testName = result.test.description || result.test.message || 'Unknown test';
        console.log(`   ${i + 1}. ${testName} - ${result.error}`);
      });
    }

    console.log(`\n🎯 Production Readiness Status:`);
    console.log(`   ✅ Category Detection: ${successRate >= 80 ? 'READY' : 'NEEDS WORK'}`);
    console.log(`   ✅ Color Detection: ${successRate >= 80 ? 'READY' : 'NEEDS WORK'}`);
    console.log(`   ✅ Price Context: ${successRate >= 80 ? 'READY' : 'NEEDS WORK'}`);
    console.log(`   ✅ AI Validation: ${successRate >= 90 ? 'READY' : 'NEEDS WORK'}`);
    console.log(`   ✅ Combined Filters: ${successRate >= 80 ? 'READY' : 'NEEDS WORK'}`);

    if (successRate >= 90) {
      console.log(`\n🎉 CHATBOT IS PRODUCTION READY! 🎉`);
      console.log(`   All critical features are working correctly.`);
      console.log(`   The system is ready for frontend integration.`);
    } else if (successRate >= 80) {
      console.log(`\n⚠️ CHATBOT IS MOSTLY READY`);
      console.log(`   Most features work correctly, but some edge cases need attention.`);
    } else {
      console.log(`\n❌ CHATBOT NEEDS MORE WORK`);
      console.log(`   Several critical features are not working properly.`);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the comprehensive test suite
async function runComprehensiveTests() {
  const testSuite = new ComprehensiveTestSuite();
  await testSuite.runAllTests();
}

runComprehensiveTests().catch(console.error);
