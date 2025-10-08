const { parseMessage } = require('./server/dist/services/chatbot/MessageParser');

console.log('Testing price parsing with context:');
console.log('"nen 20$":', parseMessage('nen 20$'));
console.log('"nën 20$":', parseMessage('nën 20$'));
console.log('"under 20$":', parseMessage('under 20$'));
