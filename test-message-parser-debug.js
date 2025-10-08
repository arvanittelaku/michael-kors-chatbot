// Test MessageParser directly
const { MessageParser } = require('./server/dist/services/chatbot/MessageParser');

function testMessageParser() {
  console.log('🧪 Testing MessageParser...');
  
  const parser = new MessageParser();
  
  // Test 1: "dua kemish te zez"
  console.log('\n1️⃣ Test: "dua kemish te zez"');
  const result1 = parser.parse("dua kemish te zez");
  console.log('Parsed filters:', JSON.stringify(result1, null, 2));
  
  // Test 2: "kemish"
  console.log('\n2️⃣ Test: "kemish"');
  const result2 = parser.parse("kemish");
  console.log('Parsed filters:', JSON.stringify(result2, null, 2));
  
  // Test 3: "te zez"
  console.log('\n3️⃣ Test: "te zez"');
  const result3 = parser.parse("te zez");
  console.log('Parsed filters:', JSON.stringify(result3, null, 2));
}

testMessageParser();

