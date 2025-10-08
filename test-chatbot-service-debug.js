// Test the entire ChatbotService flow
const { ChatbotService } = require('./server/dist/services/chatbot/ChatbotService');

async function testChatbotService() {
  console.log('🧪 Testing ChatbotService flow...');
  
  // Test 1: "dua kemish te zez"
  console.log('\n1️⃣ Test: "dua kemish te zez"');
  const result1 = await ChatbotService.handleMessage({
    userId: 'test_debug',
    message: 'dua kemish te zez',
    timestamp: new Date()
  });
  
  console.log('Response message length:', result1.message.length);
  console.log('Products count:', result1.products.length);
  console.log('Session appliedFilters:', JSON.stringify(result1.sessionContext?.appliedFilters, null, 2));
  
  if (result1.products.length > 0) {
    console.log('First product:', result1.products[0].name, result1.products[0].color);
  }
}

testChatbotService().catch(console.error);

