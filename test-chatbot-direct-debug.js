// Test ChatbotService directly to see what's happening
require('dotenv').config();
const { ChatbotService } = require('./server/dist/services/chatbot/ChatbotService');

async function testChatbotServiceDirect() {
  console.log('🔍 Testing ChatbotService directly...');
  
  const request = {
    userId: 'test',
    message: 'kemishe'
  };
  
  try {
    console.log('📤 Calling ChatbotService.handleMessage...');
    const response = await ChatbotService.handleMessage(request);
    
    console.log('✅ Response received');
    console.log('Products count:', response.products.length);
    console.log('First product ID:', response.products[0]?.id);
    console.log('First product name:', response.products[0]?.name);
    
    const isRealData = response.products.some(p => !p.id.startsWith('ai_generated'));
    console.log('Contains real data:', isRealData);
    
    if (isRealData) {
      console.log('🎉 SUCCESS: ChatbotService is returning real data!');
    } else {
      console.log('❌ ISSUE: ChatbotService is returning AI-generated products');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChatbotServiceDirect();

