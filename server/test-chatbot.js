/**
 * Test script for the AI-powered chatbot
 */

const axios = require('axios');

async function testChatbot() {
  console.log('🧪 Testing AI-powered chatbot...');

  // Test cases
  const testCases = [
    { userId: 'user1', message: 'kemishe e kuqe' },
    { userId: 'user1', message: 'nen 20$' },
    { userId: 'user1', message: 'size M' },
    { userId: 'user1', message: 'pambuk' },
    { userId: 'user2', message: 'dua kemishe te kuqe nen 20$' },
    { userId: 'user2', message: 'which one do you suggest?' }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test ${i + 1}: "${testCase.message}"`);
    
    try {
      const response = await axios.post('http://localhost:5000/chat', testCase, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ Success:');
      console.log('Message:', response.data.message);
      console.log('Products found:', response.data.products.length);
      if (response.data.products.length > 0) {
        console.log('First product:', response.data.products[0].name, '-', response.data.products[0].price + '$');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.statusText || error.message);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Test message parser specifically
function testMessageParser() {
  console.log('🔍 Testing Message Parser...');
  
  // Import the compiled MessageParser
  const { parseMessage } = require('./dist/services/chatbot/MessageParser');
  
  const testMessages = [
    'dua kemishe te kuqe nen 20$',
    'dua produkte te pambukit',
    'dua blu shirt 18$ size M',
    'filter by red color',
    'show me bigger sizes',
    'kemishe e zezë mbi 25$'
  ];
  
  testMessages.forEach((message, index) => {
    console.log(`\nTest ${index + 1}: "${message}"`);
    const filters = parseMessage(message);
    console.log('Extracted filters:', filters);
  });
}

async function main() {
  try {
    console.log('🚀 Starting chatbot tests...\n');
    
    // Test message parser first
    testMessageParser();
    
    console.log('\n⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test chatbot endpoint
    await testChatbot();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
